// PickLockLiveActivity.swift  — widget extension target "PickLockLive"
//
// Lock-screen card + Dynamic Island for a live PickLock matchup. Mirrors the
// in-app week card: league, you vs opponent, win probability bar, one chip per
// live/graded pick. Colours match the app's IOS palette.

import ActivityKit
import SwiftUI
import WidgetKit

private extension Color {
    static let plBlue   = Color(red: 0.231, green: 0.435, blue: 0.878)   // #3B6FE0
    static let plGreen  = Color(red: 0.188, green: 0.820, blue: 0.345)   // #30D158
    static let plYellow = Color(red: 1.000, green: 0.839, blue: 0.039)   // #FFD60A
    static let plRed    = Color(red: 1.000, green: 0.271, blue: 0.227)   // #FF453A
    static let plDim    = Color.white.opacity(0.55)
}

private func stateColor(_ s: String) -> Color {
    switch s { case "W": return .plGreen; case "L": return .plRed; default: return .plYellow }
}

private func fmtPts(_ v: Double) -> String {
    v == v.rounded() ? String(format: "%.0f", v) : String(format: "%.1f", v)
}

struct PickLockLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PickLockActivityAttributes.self) { context in
            LockScreenCard(attrs: context.attributes, st: context.state)
                .activityBackgroundTint(.black)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(fmtPts(context.state.myPts)).font(.system(size: 24, weight: .heavy, design: .rounded))
                        Text(context.state.myName).font(.system(size: 10, weight: .bold)).foregroundStyle(Color.plDim)
                    }.padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(fmtPts(context.state.oppPts)).font(.system(size: 24, weight: .heavy, design: .rounded))
                        Text(context.state.oppName).font(.system(size: 10, weight: .bold)).foregroundStyle(Color.plDim).lineLimit(1)
                    }.padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.leagueName.uppercased())
                            .font(.system(size: 9, weight: .heavy)).tracking(0.8).foregroundStyle(Color.plDim)
                        Text("\(context.state.winProb)% · \(context.state.liveCount) live")
                            .font(.system(size: 11, weight: .heavy)).foregroundStyle(Color.plGreen)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    WinBar(prob: context.state.winProb).padding(.horizontal, 6).padding(.top, 2)
                }
            } compactLeading: {
                HStack(spacing: 4) {
                    Circle().fill(Color.plGreen).frame(width: 6, height: 6)
                    Text("PL").font(.system(size: 11, weight: .heavy))
                }
            } compactTrailing: {
                Text(netLabel(context.state)).font(.system(size: 11, weight: .heavy)).foregroundStyle(Color.plGreen)
            } minimal: {
                Circle().fill(Color.plGreen).frame(width: 8, height: 8)
            }
            .widgetURL(URL(string: "picklock://matchup"))
        }
    }
}

private func netLabel(_ st: PickLockActivityAttributes.ContentState) -> String {
    let d = st.myPts - st.oppPts
    let s = d >= 0 ? "+" + fmtPts(d) : "−" + fmtPts(-d)
    return "\(s) · \(st.liveCount) live"
}

private struct WinBar: View {
    let prob: Int
    var body: some View {
        HStack(spacing: 8) {
            Text("\(prob)%").font(.system(size: 11, weight: .heavy))
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.12))
                    Capsule().fill(LinearGradient(colors: [.plBlue, .plGreen], startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(6, g.size.width * CGFloat(prob) / 100))
                }
            }.frame(height: 6)
            Text("\(100 - prob)%").font(.system(size: 11, weight: .heavy)).foregroundStyle(Color.plDim)
        }
    }
}

private struct LockScreenCard: View {
    let attrs: PickLockActivityAttributes
    let st: PickLockActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack {
                HStack(spacing: 6) {
                    Text("P").font(.system(size: 9, weight: .black)).foregroundStyle(.white)
                        .frame(width: 16, height: 16).background(Color.plBlue).clipShape(RoundedRectangle(cornerRadius: 5))
                    Text("\(attrs.leagueName) · Week \(attrs.week)".uppercased())
                        .font(.system(size: 10, weight: .heavy)).tracking(1).foregroundStyle(Color.plDim)
                }
                Spacer()
                HStack(spacing: 5) {
                    if !st.ended { Circle().fill(Color.plGreen).frame(width: 6, height: 6) }
                    Text(st.ended ? "FINAL" : "LIVE · \(st.liveCount) GAME\(st.liveCount == 1 ? "" : "S")")
                        .font(.system(size: 10, weight: .heavy)).tracking(0.8)
                        .foregroundStyle(st.ended ? Color.plDim : Color.plGreen)
                }
            }

            HStack(alignment: .center) {
                HStack(spacing: 10) {
                    Avatar(initials: initials(st.myName), fill: .plBlue)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(fmtPts(st.myPts)).font(.system(size: 30, weight: .heavy, design: .rounded))
                        Text(st.myName).font(.system(size: 11, weight: .bold)).foregroundStyle(Color.plDim)
                    }
                }
                Spacer()
                VStack(spacing: 2) {
                    Text("VS").font(.system(size: 9, weight: .heavy)).tracking(0.8).foregroundStyle(Color.white.opacity(0.4))
                    Text(st.status).font(.system(size: 11, weight: .heavy)).foregroundStyle(statusColor)
                }
                Spacer()
                HStack(spacing: 10) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(fmtPts(st.oppPts)).font(.system(size: 30, weight: .heavy, design: .rounded))
                        Text(st.oppName).font(.system(size: 11, weight: .bold)).foregroundStyle(Color.plDim).lineLimit(1)
                    }
                    Avatar(initials: initials(st.oppName), fill: Color.white.opacity(0.14))
                }
            }

            if attrs.leagueType == "h2h" { WinBar(prob: st.winProb) }

            if !st.picks.isEmpty {
                HStack(spacing: 6) {
                    ForEach(Array(st.picks.prefix(3)), id: \.self) { p in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(p.kind).font(.system(size: 8, weight: .heavy)).tracking(0.6).foregroundStyle(Color.white.opacity(0.4))
                            Text(p.label).font(.system(size: 11, weight: .heavy)).lineLimit(1)
                            Text(p.status).font(.system(size: 10, weight: .bold)).foregroundStyle(stateColor(p.state)).lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 6).padding(.horizontal, 8)
                        .background(Color.white.opacity(0.06))
                        .overlay(Rectangle().fill(stateColor(p.state)).frame(width: 3), alignment: .leading)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 13)
        .foregroundStyle(.white)
    }

    private var statusColor: Color {
        switch st.status {
        case "Leading", "Alive": return .plGreen
        case "Trailing", "Eliminated": return .plRed
        default: return .plBlue
        }
    }
    private func initials(_ s: String) -> String {
        String(s.replacingOccurrences(of: "_", with: " ").split(separator: " ").prefix(2).compactMap { $0.first }).uppercased()
    }
}

private struct Avatar: View {
    let initials: String
    let fill: Color
    var body: some View {
        Text(initials).font(.system(size: 12, weight: .heavy))
            .frame(width: 38, height: 38).background(fill).clipShape(Circle())
    }
}
