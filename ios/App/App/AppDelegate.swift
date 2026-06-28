import UIKit
import Capacitor
import WebKit
import SafariServices

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DispatchQueue.main.async { [weak self] in
            if let bridgeViewController = self?.window?.rootViewController as? CAPBridgeViewController {
                bridgeViewController.webView?.allowsBackForwardNavigationGestures = true
            }
        }

        return true
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

}
