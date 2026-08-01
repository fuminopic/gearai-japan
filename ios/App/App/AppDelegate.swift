import UIKit
import Capacitor
import WebKit
import SafariServices
import CryptoKit
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var nativeNotificationsBridge: NativeNotificationsBridge?
    private var nativeNotificationDelegate: NativeNotificationDelegate?
    private var pendingNotificationRoute: String?

    func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureNativeNotificationDelegate()
        return true
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureNativeNotificationDelegate()

        DispatchQueue.main.async { [weak self] in
            if let bridgeViewController = self?.window?.rootViewController as? CAPBridgeViewController {
                bridgeViewController.webView?.allowsBackForwardNavigationGestures = true
                self?.installNativeNotificationsBridge(on: bridgeViewController)
            }

            #if DEBUG
            self?.loadNotificationPoCWhenRequested()
            #endif
        }

        return true
    }

    /// iOS can deliver a notification response during a cold launch. Register
    /// before launch finishes, rather than waiting for Capacitor or the remote
    /// page to become available.
    private func configureNativeNotificationDelegate() {
        if nativeNotificationDelegate == nil {
            nativeNotificationDelegate = NativeNotificationDelegate(
                onOpen: { [weak self] route in self?.openNativeNotificationRoute(route) }
            )
        }
        // Capacitor creates its own notification router during startup. Reassign
        // our forwarding delegate synchronously in both launch callbacks so a
        // notification tap that cold-launches the app cannot be consumed before
        // the Web → Native route queue is ready.
        UNUserNotificationCenter.current().delegate = nativeNotificationDelegate
    }

    private func installNativeNotificationsBridge(on bridgeViewController: CAPBridgeViewController) {
        guard let bridge = bridgeViewController.bridge, let webView = bridgeViewController.webView else {
            NSLog("[NativeNotifications] bridge install skipped: Capacitor bridge unavailable")
            return
        }

        let nativeBridge = NativeNotificationsBridge(bridge: bridge, webView: webView)
        nativeBridge.install()
        nativeNotificationsBridge = nativeBridge

        nativeNotificationDelegate?.router = bridge.notificationRouter
        UNUserNotificationCenter.current().delegate = nativeNotificationDelegate
        NSLog("[NativeNotifications] bridge installed; LocalNotifications registered=%@", bridge.plugin(withName: "LocalNotifications") != nil ? "true" : "false")
        deliverPendingNotificationRoute()
    }

    private func openNativeNotificationRoute(_ route: String) {
        guard NativeNotificationsBridge.isValidRoute(route, key: NativeNotificationsBridge.planId(from: route)) else {
            NSLog("[NativeNotifications] ignored invalid notification route")
            return
        }

        guard let nativeNotificationsBridge else {
            pendingNotificationRoute = route
            UserDefaults.standard.set(route, forKey: NativeNotificationsBridge.pendingRouteStorageKey)
            NSLog("[NativeNotifications] queued notification route until bridge installation")
            return
        }

        nativeNotificationsBridge.openNotificationRoute(route)
    }

    private func deliverPendingNotificationRoute() {
        let route = pendingNotificationRoute ?? UserDefaults.standard.string(forKey: NativeNotificationsBridge.pendingRouteStorageKey)
        guard let route else { return }
        pendingNotificationRoute = nil
        nativeNotificationsBridge?.openNotificationRoute(route)
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        if url.scheme == "yamajitaku", url.host == "auth", url.path == "/callback" {
            closePresentedSafariViewController()
            loadOAuthCallbackInWebView(url)
            return true
        }

        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func loadOAuthCallbackInWebView(_ url: URL) {
        guard
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
            let query = components.percentEncodedQuery
        else {
            return
        }

        // Load the bundled local login page with the OAuth tokens (instead of the
        // remote callback directly) so it stores the session locally — keeping
        // the user signed in across launches — and shows the same splash/handoff
        // as email login.
        components.scheme = "capacitor"
        components.host = "localhost"
        components.path = "/"
        components.percentEncodedQuery = query

        guard
            let callbackUrl = components.url,
            let bridgeViewController = window?.rootViewController as? CAPBridgeViewController
        else {
            return
        }

        bridgeViewController.webView?.load(URLRequest(url: callbackUrl))
    }

    private func closePresentedSafariViewController() {
        guard let rootViewController = window?.rootViewController else {
            return
        }

        if rootViewController.presentedViewController is SFSafariViewController {
            rootViewController.dismiss(animated: true)
            return
        }

        if rootViewController.presentedViewController != nil {
            rootViewController.dismiss(animated: true)
        }
    }

    #if DEBUG
    /// Debug-only Local Notifications proof-of-connection entry point.
    ///
    /// Pass `-YamajitakuNotificationPoC` from the Xcode Run scheme. This loads
    /// a bundled `capacitor://localhost` page and therefore never exposes a
    /// Capacitor plugin to the remote www.yamajitaku.com application.
    private func loadNotificationPoCWhenRequested() {
        guard ProcessInfo.processInfo.arguments.contains("-YamajitakuNotificationPoC") else {
            return
        }

        guard
            let bridgeViewController = window?.rootViewController as? CAPBridgeViewController,
            let pocUrl = URL(string: "capacitor://localhost/notification-poc.html")
        else {
            NSLog("[NotificationPoC] launch failed: CAPBridgeViewController or bundled page unavailable")
            return
        }

        let isRegistered = bridgeViewController.bridge?.plugin(withName: "LocalNotifications") != nil
        NSLog("[NotificationPoC] launch requested; LocalNotifications registered=%@", isRegistered ? "true" : "false")
        bridgeViewController.webView?.load(URLRequest(url: pocUrl))
    }
    #endif

}

// MARK: - Strict remote Web → Native Local Notifications bridge

private final class NativeNotificationsBridge: NSObject, WKScriptMessageHandler {
    private static let handlerName = "yamajitakuNativeNotifications"
    private static let allowedHosts = Set(["yamajitaku.com", "www.yamajitaku.com"])
    private static let markerKey = "yamajitakuNativeReminder"
    private static let markerValue = "v1"
    private static let deferredKey = "yamajitaku.notifications.promptDeferred"
    private static let nextIdentifierKey = "yamajitaku.notifications.nextIdentifier"
    fileprivate static let pendingRouteStorageKey = "yamajitaku.notifications.pendingRoute"

    #if DEBUG
    private static let fastReminderArgument = "-YamajitakuFastTripReminder"
    private static let fastReminderDelay: TimeInterval? =
        ProcessInfo.processInfo.arguments.contains(fastReminderArgument) ? 120 : nil
    #else
    private static let fastReminderDelay: TimeInterval? = nil
    #endif

    private weak var bridge: CAPBridgeProtocol?
    private weak var webView: WKWebView?
    private var pendingRoute: String?

    init(bridge: CAPBridgeProtocol, webView: WKWebView) {
        self.bridge = bridge
        self.webView = webView
    }

    func install() {
        guard let controller = webView?.configuration.userContentController else { return }
        controller.removeScriptMessageHandler(forName: Self.handlerName)
        controller.add(self, name: Self.handlerName)
        controller.addUserScript(
            WKUserScript(source: Self.bootstrapScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        if let route = UserDefaults.standard.string(forKey: Self.pendingRouteStorageKey),
           Self.isValidRoute(route, key: Self.planId(from: route)) {
            pendingRoute = route
            NSLog("[NativeNotifications] restored pending notification route")
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName,
              isAllowedRemotePage(message.webView?.url),
              let body = message.body as? [String: Any],
              let command = body["command"] as? String,
              let requestId = body["requestId"] as? String,
              requestId.count > 0, requestId.count <= 128 else {
            NSLog("[NativeNotifications] rejected bridge message")
            return
        }

        let payload = body["payload"] as? [String: Any] ?? [:]
        switch command {
        case "ready":
            NSLog("[NativeNotifications] trusted remote bridge ready")
            if let route = pendingRoute { sendRoute(route) }
        case "checkPermission":
            invokePlugin("checkPermissions", options: [:]) { [weak self] result in
                self?.reply(requestId, result: result)
            }
        case "requestPermission":
            NSLog("[NativeNotifications] requestPermissions invoked from user gesture bridge")
            invokePlugin("requestPermissions", options: [:]) { [weak self] result in
                self?.reply(requestId, result: result)
            }
        case "getPromptDeferred":
            reply(requestId, result: ["deferred": UserDefaults.standard.bool(forKey: Self.deferredKey)])
        case "setPromptDeferred":
            guard let deferred = payload["deferred"] as? Bool else { reply(requestId, error: "invalid deferred payload"); return }
            UserDefaults.standard.set(deferred, forKey: Self.deferredKey)
            reply(requestId, result: ["deferred": deferred])
        case "openSettings":
            guard payload.isEmpty else { reply(requestId, error: "invalid settings payload"); return }
            openSettings()
            reply(requestId, result: ["opened": true])
        case "reconcile":
            reconcile(payload) { [weak self] result in self?.reply(requestId, result: result) }
        default:
            NSLog("[NativeNotifications] rejected unknown command")
            reply(requestId, error: "unsupported command")
        }
    }

    func openNotificationRoute(_ route: String) {
        guard Self.isValidRoute(route, key: Self.planId(from: route)) else { return }
        UserDefaults.standard.set(route, forKey: Self.pendingRouteStorageKey)
        pendingRoute = route
        sendRoute(route)
    }

    private func sendRoute(_ route: String) {
        guard let currentURL = webView?.url else {
            return
        }

        // On a cold launch, start from the bundled login shell. Let that shell
        // preserve its established session handoff but give it the validated
        // checklist path, so it can skip an otherwise unnecessary dashboard
        // request before opening the plan.
        if isLocalShellPage(currentURL), let handoffURL = localRouteHandoffURL(route) {
            NSLog("[NativeNotifications] handing cold launch directly to checklist")
            webView?.load(URLRequest(url: handoffURL))
            return
        }

        guard
            isAllowedRemotePage(currentURL),
            let destinationURL = URL(string: route, relativeTo: currentURL)?.absoluteURL
        else { return }

        // A notification tap can cold-launch while the remote page is still
        // hydrating. Navigate the validated in-app URL natively rather than
        // relying on a JavaScript custom-event listener in that document.
        if !isCurrentRoute(route, url: currentURL) {
            NSLog("[NativeNotifications] loading checklist route")
            webView?.load(URLRequest(url: destinationURL))
            return
        }

        pendingRoute = nil
        UserDefaults.standard.removeObject(forKey: Self.pendingRouteStorageKey)
    }

    private func isLocalShellPage(_ url: URL) -> Bool {
        url.scheme == "capacitor" && url.host == "localhost"
    }

    private func localRouteHandoffURL(_ route: String) -> URL? {
        var components = URLComponents()
        components.scheme = "capacitor"
        components.host = "localhost"
        components.path = "/"
        components.queryItems = [URLQueryItem(name: "notification_route", value: route)]
        return components.url
    }

    private func isCurrentRoute(_ route: String, url: URL) -> Bool {
        guard let routeComponents = URLComponents(string: route),
              let urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return false
        }
        return routeComponents.path == urlComponents.path
            && routeComponents.queryItems == urlComponents.queryItems
    }

    private func reconcile(_ payload: [String: Any], completion: @escaping ([String: Any]) -> Void) {
        guard let scope = payload["scope"] as? String, UUID(uuidString: scope) != nil,
              let rawReminders = payload["reminders"] as? [[String: Any]], rawReminders.count <= 100 else {
            completion(["error": "invalid reconcile payload"])
            return
        }

        let reminders = rawReminders.compactMap(Reminder.init)
        guard reminders.count == rawReminders.count,
              Set(reminders.map(\.key)).count == reminders.count else {
            completion(["error": "invalid reminder configuration"])
            return
        }

        invokePlugin("getPending", options: [:]) { [weak self] pendingResult in
            guard let self else { return }
            let pending = (pendingResult["notifications"] as? [[String: Any]]) ?? []
            let pendingById = Dictionary(uniqueKeysWithValues: pending.compactMap { item -> (Int, [String: Any])? in
                guard let id = item["id"] as? Int else { return nil }
                return (id, item)
            })
            self.reconcile(reminders: reminders, scope: scope, pendingById: pendingById, completion: completion)
        }
    }

    private func reconcile(reminders: [Reminder], scope: String, pendingById: [Int: [String: Any]], completion: @escaping ([String: Any]) -> Void) {
        let now = Date()
        let isFastReminderMode = Self.fastReminderDelay != nil
        let effectiveReminders = reminders.map { reminder in
            guard let delay = Self.fastReminderDelay else { return reminder }
            return reminder.replacingOneOffSchedule(
                at: debugScheduleDate(for: reminder, scope: scope, now: now, delay: delay)
            )
        }
        let desired = effectiveReminders.filter { reminder in
            if reminder.isPast(now) {
                NSLog("[NativeNotifications] skipped past reminder")
                return false
            }
            return true
        }
        let desiredByKey = Dictionary(uniqueKeysWithValues: desired.map { ($0.key, $0) })
        var cancellationIds: Set<Int> = []
        var schedules: [Reminder] = []

        for (id, pending) in pendingById {
            guard let extra = pending["extra"] as? [String: Any],
                  extra[Self.markerKey] as? String == Self.markerValue,
                  extra["scope"] as? String == scope,
                  let key = extra["key"] as? String else { continue }
            guard let reminder = desiredByKey[key],
                  extra["fingerprint"] as? String == reminder.fingerprint,
                  extra["route"] as? String == reminder.route,
                  id == notificationIdentifier(scope: scope, key: key, occupied: Set(pendingById.keys)) else {
                cancellationIds.insert(id)
                continue
            }
        }

        for reminder in desired {
            let id = notificationIdentifier(scope: scope, key: reminder.key, occupied: Set(pendingById.keys))
            let existing = pendingById[id]
            let existingFingerprint = ((existing?["extra"] as? [String: Any])?["fingerprint"] as? String)
            if existingFingerprint != reminder.fingerprint { schedules.append(reminder) }
        }

        let immediate = isFastReminderMode
            ? []
            : reminders.compactMap { reminder in
                reminder.isPast(now) ? reminder.immediate?.payload : nil
            }

        cancel(Array(cancellationIds)) { [weak self] in
            guard let self else { return }
            self.invokePlugin("checkPermissions", options: [:]) { permission in
                let isGranted = permission["display"] as? String == "granted"
                let complete: (Int) -> Void = { scheduled in
                    NSLog("[NativeNotifications] reconcile complete scheduled=%d cancelled=%d immediate=%d fastMode=%@", scheduled, cancellationIds.count, immediate.count, isFastReminderMode ? "true" : "false")
                    completion([
                        "scheduled": scheduled,
                        "cancelled": cancellationIds.count,
                        "skippedPast": reminders.count - desired.count,
                        "immediate": immediate,
                        "fastMode": isFastReminderMode
                    ])
                }

                guard isGranted else {
                    NSLog("[NativeNotifications] reconcile scheduling skipped: permission=%@", permission["display"] as? String ?? "unknown")
                    complete(0)
                    return
                }

                self.schedule(schedules, scope: scope, completion: complete)
            }
        }
    }

    private func debugScheduleDate(for reminder: Reminder, scope: String, now: Date, delay: TimeInterval) -> Date {
        let defaults = UserDefaults.standard
        let sourceKey = "yamajitaku.notifications.fast-source.\(scope).\(reminder.key)"
        let dateKey = "yamajitaku.notifications.fast-at.\(scope).\(reminder.key)"
        let sourceFingerprint = reminder.fingerprint
        let existingDate = Date(timeIntervalSince1970: defaults.double(forKey: dateKey))

        if defaults.string(forKey: sourceKey) == sourceFingerprint, existingDate > now {
            return existingDate
        }

        let date = now.addingTimeInterval(delay)
        defaults.set(sourceFingerprint, forKey: sourceKey)
        defaults.set(date.timeIntervalSince1970, forKey: dateKey)
        NSLog("[NativeNotifications] DEBUG fast reminder key=%@ at=%@", reminder.key, ISO8601DateFormatter().string(from: date))
        return date
    }

    private func schedule(_ reminders: [Reminder], scope: String, completion: @escaping (Int) -> Void) {
        guard !reminders.isEmpty else { completion(0); return }
        let occupied: Set<Int> = []
        let notifications: JSArray = reminders.map { reminder -> JSObject in
            let id = notificationIdentifier(scope: scope, key: reminder.key, occupied: occupied)
            NSLog("[NativeNotifications] scheduling id=%d %@", id, reminder.logSchedule)
            return [
                "id": id,
                "title": reminder.title,
                "body": reminder.body,
                "schedule": reminder.pluginSchedule,
                "extra": [
                    Self.markerKey: Self.markerValue,
                    "scope": scope,
                    "key": reminder.key,
                    "route": reminder.route,
                    "fingerprint": reminder.fingerprint
                ]
            ]
        }
        invokePlugin("schedule", options: ["notifications": notifications]) { result in
            let count = (result["notifications"] as? [[String: Any]])?.count ?? 0
            NSLog("[NativeNotifications] scheduled count=%d", count)
            completion(count)
        }
    }

    private func cancel(_ ids: [Int], completion: @escaping () -> Void) {
        guard !ids.isEmpty else { completion(); return }
        let notifications: JSArray = ids.map { id in ["id": id] as JSObject }
        invokePlugin("cancel", options: ["notifications": notifications]) { _ in completion() }
    }

    private func notificationIdentifier(scope: String, key: String, occupied: Set<Int>) -> Int {
        let storageKey = "yamajitaku.notifications.id.\(scope).\(key)"
        let defaults = UserDefaults.standard
        let stored = defaults.integer(forKey: storageKey)
        if stored > 0 { return stored }
        var next = max(defaults.integer(forKey: Self.nextIdentifierKey), 100_000)
        repeat { next += 1 } while occupied.contains(next)
        defaults.set(next, forKey: Self.nextIdentifierKey)
        defaults.set(next, forKey: storageKey)
        return next
    }

    private func invokePlugin(_ method: String, options: JSObject, completion: @escaping ([String: Any]) -> Void) {
        guard let plugin = bridge?.plugin(withName: "LocalNotifications") else {
            NSLog("[NativeNotifications] LocalNotifications plugin unavailable")
            completion(["error": "plugin unavailable"])
            return
        }
        let selector = NSSelectorFromString("\(method):")
        guard plugin.responds(to: selector) else {
            completion(["error": "plugin method unavailable"])
            return
        }
        let call = CAPPluginCall(
            callbackId: UUID().uuidString,
            methodName: method,
            options: options,
            success: { result, _ in
                let data = result?.data ?? [:]
                if method == "checkPermissions" || method == "requestPermissions" {
                    NSLog("[NativeNotifications] %@ result=%@", method, data["display"] as? String ?? "unknown")
                } else if method == "getPending" {
                    let count = (data["notifications"] as? [[String: Any]])?.count ?? 0
                    NSLog("[NativeNotifications] pending count=%d", count)
                }
                DispatchQueue.main.async { completion(data) }
            },
            error: { error in
                NSLog("[NativeNotifications] plugin %@ failed: %@", method, error?.message ?? "unknown")
                DispatchQueue.main.async { completion(["error": error?.message ?? "plugin failed"]) }
            }
        )
        plugin.perform(selector, with: call)
    }

    private func reply(_ requestId: String, result: [String: Any] = [:], error: String? = nil) {
        var body: [String: Any] = ["requestId": requestId, "result": result]
        if let error { body["error"] = error }
        guard isAllowedRemotePage(webView?.url), let json = jsonString(body) else { return }
        webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('__yamajitakuNativeNotificationsResponse', { detail: \(json) }));")
    }

    private func openSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString), UIApplication.shared.canOpenURL(url) else { return }
        UIApplication.shared.open(url)
    }

    private func isAllowedRemotePage(_ url: URL?) -> Bool {
        guard let url else { return false }
        if url.scheme == "https", let host = url.host?.lowercased(), Self.allowedHosts.contains(host) {
            return true
        }
        return false
    }

    fileprivate static func isValidRoute(_ route: String, key: String?) -> Bool {
        guard let key, UUID(uuidString: key) != nil,
              let components = URLComponents(string: route), components.scheme == nil,
              components.host == nil, components.path == "/plan" else { return false }
        let values = Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).map { ($0.name, $0.value ?? "") })
        guard values["id"] == key, values.count == 2 else { return false }
        // `focus=checklist` was emitted by the first release candidate. Keep
        // accepting it so a notification already pending on a device remains
        // safe, while all new reminders use the dedicated, faster checklist
        // route below.
        return values["view"] == "checklist" || values["focus"] == "checklist"
    }

    fileprivate static func planId(from route: String) -> String? {
        URLComponents(string: route)?.queryItems?.first(where: { $0.name == "id" })?.value
    }

    private func jsonString(_ value: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(value), let data = try? JSONSerialization.data(withJSONObject: value), let string = String(data: data, encoding: .utf8) else { return nil }
        return string
    }

    private static let bootstrapScript = """
    (() => {
      const allowed = location.protocol === 'https:' && (location.hostname === 'yamajitaku.com' || location.hostname === 'www.yamajitaku.com');
      const handler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.yamajitakuNativeNotifications;
      if (!allowed || !handler || window.YamajitakuNativeNotifications) return;
      const pending = new Map();
      window.YamajitakuNativeNotifications = { invoke(command, payload = {}) {
        return new Promise((resolve, reject) => {
          const requestId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
          pending.set(requestId, { resolve, reject });
          handler.postMessage({ command, requestId, payload });
          setTimeout(() => { const call = pending.get(requestId); if (call) { pending.delete(requestId); call.reject(new Error('native notification bridge timeout')); } }, 10000);
        });
      }};
      window.addEventListener('__yamajitakuNativeNotificationsResponse', event => {
        const detail = event.detail || {}, call = pending.get(detail.requestId);
        if (!call) return;
        pending.delete(detail.requestId);
        detail.error ? call.reject(new Error(detail.error)) : call.resolve(detail.result || {});
      });
      window.addEventListener('yamajitaku-native-notification-route', event => {
        const route = event.detail && event.detail.route;
        if (typeof route === 'string' && /^\\/plan\\?id=[0-9a-f-]{36}&(?:view|focus)=checklist$/i.test(route)) location.assign(route);
      });
      handler.postMessage({ command: 'ready', requestId: 'ready', payload: {} });
    })();
    """
}

private struct Reminder {
    let key: String
    let title: String
    let body: String
    let route: String
    let schedule: Schedule
    let immediate: ImmediateChecklistReminder?

    enum Schedule {
        case once(Date)
        case weekly(weekday: Int, hour: Int, minute: Int)
    }

    private init(key: String, title: String, body: String, route: String, schedule: Schedule, immediate: ImmediateChecklistReminder?) {
        self.key = key
        self.title = title
        self.body = body
        self.route = route
        self.schedule = schedule
        self.immediate = immediate
    }

    init?(_ payload: [String: Any]) {
        guard let key = payload["key"] as? String, UUID(uuidString: key) != nil,
              let title = payload["title"] as? String, !title.isEmpty, title.count <= 120,
              let body = payload["body"] as? String, !body.isEmpty, body.count <= 240,
              let route = payload["route"] as? String,
              NativeNotificationsBridge.isValidRoute(route, key: key),
              let schedulePayload = payload["schedule"] as? [String: Any],
              schedulePayload["timeZone"] as? String == "Asia/Tokyo",
              let kind = schedulePayload["kind"] as? String else { return nil }
        self.key = key; self.title = title; self.body = body; self.route = route
        immediate = (payload["immediate"] as? [String: Any]).flatMap(ImmediateChecklistReminder.init)
        if kind == "once", let at = schedulePayload["at"] as? String, let date = Self.date(from: at) {
            schedule = .once(date)
        } else if kind == "weekly", let weekday = schedulePayload["weekday"] as? Int, let hour = schedulePayload["hour"] as? Int, let minute = schedulePayload["minute"] as? Int, (1...7).contains(weekday), (0...23).contains(hour), (0...59).contains(minute) {
            schedule = .weekly(weekday: weekday, hour: hour, minute: minute)
        } else { return nil }
    }

    /// Web `Date#toISOString()` includes fractional seconds. Accept that
    /// canonical representation as well as a valid ISO-8601 timestamp
    /// without them for trusted bridge clients.
    private static func date(from value: String) -> Date? {
        fractionalDateFormatter.date(from: value) ?? dateFormatter.date(from: value)
    }

    private static let fractionalDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let dateFormatter = ISO8601DateFormatter()

    var pluginSchedule: JSObject {
        switch schedule {
        case .once(let date): return ["at": date, "repeats": false]
        case .weekly(let weekday, let hour, let minute): return ["on": ["weekday": weekday, "hour": hour, "minute": minute], "repeats": true]
        }
    }

    func replacingOneOffSchedule(at date: Date) -> Reminder {
        Reminder(key: key, title: title, body: body, route: route, schedule: .once(date), immediate: immediate)
    }

    func isPast(_ now: Date) -> Bool {
        if case .once(let date) = schedule { return date <= now }
        return false
    }

    var logSchedule: String {
        switch schedule {
        case .once(let date): return "at=\(ISO8601DateFormatter().string(from: date))"
        case .weekly(let weekday, let hour, let minute): return "weekly=\(weekday)-\(hour):\(minute) Asia/Tokyo"
        }
    }

    var fingerprint: String {
        let representation: String
        switch schedule {
        case .once(let date): representation = "once|\(ISO8601DateFormatter().string(from: date))"
        case .weekly(let weekday, let hour, let minute): representation = "weekly|\(weekday)|\(hour)|\(minute)|Asia/Tokyo"
        }
        let input = "\(key)|\(title)|\(body)|\(route)|\(representation)"
        return SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

private struct ImmediateChecklistReminder {
    let title: String
    let body: String
    let route: String

    init?(_ payload: [String: Any]) {
        guard let title = payload["title"] as? String, !title.isEmpty, title.count <= 120,
              let body = payload["body"] as? String, !body.isEmpty, body.count <= 240,
              let route = payload["route"] as? String,
              NativeNotificationsBridge.isValidRoute(route, key: NativeNotificationsBridge.planId(from: route)) else {
            return nil
        }
        self.title = title
        self.body = body
        self.route = route
    }

    var payload: [String: Any] {
        ["title": title, "body": body, "route": route]
    }
}

private final class NativeNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    weak var router: NotificationRouter?
    private let onOpen: (String) -> Void

    init(onOpen: @escaping (String) -> Void) {
        self.onOpen = onOpen
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        guard let router else { completionHandler([]); return }
        router.userNotificationCenter(center, willPresent: notification, withCompletionHandler: completionHandler)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if response.actionIdentifier == UNNotificationDefaultActionIdentifier,
           let extra = response.notification.request.content.userInfo["cap_extra"] as? [String: Any],
           extra["yamajitakuNativeReminder"] as? String == "v1",
           let route = extra["route"] as? String {
            if Thread.isMainThread {
                onOpen(route)
            } else {
                DispatchQueue.main.sync { self.onOpen(route) }
            }
        }
        guard let router else { completionHandler(); return }
        router.userNotificationCenter(center, didReceive: response, withCompletionHandler: completionHandler)
    }
}
