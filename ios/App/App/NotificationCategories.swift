// NotificationCategories.swift — App target (ios/App/App/).
//
// Registers the actionable notification categories. APNs delivers a category
// string in the payload ("aps": {"category": "..."}); iOS looks it up in this
// table and draws the buttons. Without this registration the push still arrives,
// it just has no buttons — so shipping the server side early is harmless.
//
// The identifiers here MUST match what api/notify.js sends:
//   notif_deadline  — "picks lock soon"        -> Pick now
//   notif_results   — a pick or week graded    -> See results
//   notif_survivor  — survivor pool deadline   -> Make my pick
//   notif_league    — league/chat activity     -> Open league
//
// Capacitor's PushNotifications plugin reports the tapped button back to JS as
// `actionId` on pushNotificationActionPerformed. The default tap (anywhere but a
// button) arrives with actionId "tap".

import UIKit
import UserNotifications

@objc class NotificationCategories: NSObject {

    @objc static func register() {
        let center = UNUserNotificationCenter.current()

        func action(_ id: String, _ title: String) -> UNNotificationAction {
            // .foreground: every one of these opens the app at a specific screen.
            UNNotificationAction(identifier: id, title: title, options: [.foreground])
        }

        let deadline = UNNotificationCategory(
            identifier: "notif_deadline",
            actions: [action("pick_now", "Pick now"), action("snooze", "Remind me in an hour")],
            intentIdentifiers: [], options: [])

        let results = UNNotificationCategory(
            identifier: "notif_results",
            actions: [action("see_results", "See results"), action("open_standings", "Standings")],
            intentIdentifiers: [], options: [])

        let survivor = UNNotificationCategory(
            identifier: "notif_survivor",
            actions: [action("survivor_pick", "Make my pick"), action("open_board", "Pool board")],
            intentIdentifiers: [], options: [])

        let league = UNNotificationCategory(
            identifier: "notif_league",
            actions: [action("open_league", "Open league"), action("open_chat", "Reply")],
            intentIdentifiers: [], options: [])

        center.setNotificationCategories([deadline, results, survivor, league])
    }
}
