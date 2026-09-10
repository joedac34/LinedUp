// LiveActivityPlugin.swift — App target (ios/App/App/).
// Capacitor 8 local plugin. Registered in AppDelegate (see LIVE_ACTIVITY_SETUP.md).
//
// JS surface (window.Capacitor.Plugins.LiveActivity):
//   isSupported()                       -> { supported, pushToStart }
//   start({ attributes, state })        -> { id }   starts and streams its push token
//   update({ state })                   -> {}       local update (server push is the normal path)
//   end({ state? })                     -> {}
//   requestPushToStartToken()           -> {}       iOS 17.2+: token arrives on the event
// Events:
//   "activityToken"     { id, token, matchupId }
//   "pushToStartToken"  { token }
//   "activityEnded"     { id }

import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPushToStartToken", returnType: CAPPluginReturnPromise),
    ]

    private var tokenTasks: [String: Task<Void, Never>] = [:]

    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            let ok = ActivityAuthorizationInfo().areActivitiesEnabled
            var p2s = false
            if #available(iOS 17.2, *) { p2s = true }
            call.resolve(["supported": ok, "pushToStart": p2s])
        } else {
            call.resolve(["supported": false, "pushToStart": false])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.reject("unsupported"); return }
        guard let a = call.getObject("attributes"), let s = call.getObject("state") else { call.reject("attributes and state required"); return }
        do {
            let attrs = try Self.decode(PickLockActivityAttributes.self, a)
            let state = try Self.decode(PickLockActivityAttributes.ContentState.self, s)
            // One activity per matchup: end any stale one for the same key first.
            for act in Activity<PickLockActivityAttributes>.activities where act.attributes.matchupId == attrs.matchupId {
                Task { await act.end(nil, dismissalPolicy: .immediate) }
            }
            let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(45 * 60))
            let act = try Activity.request(attributes: attrs, content: content, pushType: .token)
            observeToken(act)
            call.resolve(["id": act.id])
        } catch {
            call.reject("start failed: \(error.localizedDescription)")
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.reject("unsupported"); return }
        guard let s = call.getObject("state") else { call.reject("state required"); return }
        do {
            let state = try Self.decode(PickLockActivityAttributes.ContentState.self, s)
            let id = call.getString("id")
            Task {
                for act in Activity<PickLockActivityAttributes>.activities where id == nil || act.id == id {
                    await act.update(ActivityContent(state: state, staleDate: Date().addingTimeInterval(45 * 60)))
                }
                call.resolve()
            }
        } catch { call.reject("update failed: \(error.localizedDescription)") }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let id = call.getString("id")
        Task {
            for act in Activity<PickLockActivityAttributes>.activities where id == nil || act.id == id {
                await act.end(nil, dismissalPolicy: .default)
                self.notifyListeners("activityEnded", data: ["id": act.id])
            }
            call.resolve()
        }
    }

    // iOS 17.2+: a per-device token the server uses to START an activity at kickoff
    // without the app being open. Delivered through the "pushToStartToken" event.
    @objc func requestPushToStartToken(_ call: CAPPluginCall) {
        guard #available(iOS 17.2, *) else { call.resolve(["supported": false]); return }
        Task {
            for await data in Activity<PickLockActivityAttributes>.pushToStartTokenUpdates {
                let hex = data.map { String(format: "%02x", $0) }.joined()
                self.notifyListeners("pushToStartToken", data: ["token": hex])
            }
        }
        call.resolve(["supported": true])
    }

    // Re-attach token observers for activities that survived an app relaunch.
    public override func load() {
        if #available(iOS 16.2, *) {
            for act in Activity<PickLockActivityAttributes>.activities { observeToken(act) }
        }
    }

    @available(iOS 16.2, *)
    private func observeToken(_ act: Activity<PickLockActivityAttributes>) {
        tokenTasks[act.id]?.cancel()
        tokenTasks[act.id] = Task {
            for await data in act.pushTokenUpdates {
                let hex = data.map { String(format: "%02x", $0) }.joined()
                self.notifyListeners("activityToken", data: ["id": act.id, "token": hex, "matchupId": act.attributes.matchupId])
            }
        }
    }

    private static func decode<T: Decodable>(_ t: T.Type, _ obj: JSObject) throws -> T {
        let data = try JSONSerialization.data(withJSONObject: obj, options: [])
        return try JSONDecoder().decode(t, from: data)
    }
}
