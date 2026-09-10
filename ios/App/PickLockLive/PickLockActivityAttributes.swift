// PickLockActivityAttributes.swift
// Shared between the App target and the PickLockLive widget extension.
// Add this file to BOTH targets in Xcode (File Inspector > Target Membership).
//
// ContentState is what the server pushes on every grade run. Keep it flat and
// small: APNs caps a Live Activity payload at 4 KB and the JSON keys here must
// match api/live-activity.js exactly (Swift decodes by property name).

import ActivityKit
import Foundation

struct PickLockActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var myPts: Double
        var oppPts: Double
        var myName: String
        var oppName: String
        var status: String        // "Leading" | "Trailing" | "Tied" | "Alive" | "Eliminated" | "Final"
        var liveCount: Int
        var winProb: Int          // 0-100, my side
        var picks: [PickChip]     // at most 4; the widget shows what fits
        var ended: Bool
    }

    public struct PickChip: Codable, Hashable {
        var kind: String          // "SPREAD · 2×"
        var label: String         // "SEA -1.5"
        var status: String        // "Won +17" | "1 TD · Q3" | "Lost"
        var state: String         // "W" | "L" | "P"
    }

    // Fixed for the life of the activity.
    var leagueName: String
    var leagueType: String        // "h2h" | "survivor" | "points"
    var week: Int
    var matchupId: String         // league_id|week|user_id — the key the server updates by
}
