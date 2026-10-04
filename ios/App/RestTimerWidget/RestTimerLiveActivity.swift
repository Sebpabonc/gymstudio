import ActivityKit
import SwiftUI
import WidgetKit

/// GymStudio mauve (--nav-active #c99ca1).
private let mauve = Color(red: 0xC9 / 255, green: 0x9C / 255, blue: 0xA1 / 255)

private func clock(_ seconds: Double) -> String {
    let total = max(0, Int(seconds.rounded()))
    return String(format: "%d:%02d", total / 60, total % 60)
}

private struct RestCountdown: View {
    let state: RestTimerAttributes.ContentState

    var body: some View {
        if let paused = state.pausedRemaining {
            Text(clock(paused))
        } else if state.endDate > Date() {
            Text(timerInterval: Date()...state.endDate, countsDown: true)
        } else {
            Text("Go")
        }
    }
}

struct RestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            // Lock screen and banner.
            HStack(spacing: 14) {
                Image(systemName: context.state.pausedRemaining == nil ? "timer" : "pause.circle")
                    .font(.title2)
                    .foregroundStyle(mauve)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.pausedRemaining == nil ? "Rest" : "Rest paused")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(context.state.exercise)
                        .font(.headline)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                RestCountdown(state: context.state)
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 110, alignment: .trailing)
            }
            .padding(16)
            .activityBackgroundTint(Color.black.opacity(0.88))
            .activitySystemActionForegroundColor(mauve)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Rest", systemImage: "timer")
                        .font(.headline)
                        .foregroundStyle(mauve)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RestCountdown(state: context.state)
                        .font(.title2.bold())
                        .monospacedDigit()
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 90, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.exercise)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                Image(systemName: "timer").foregroundStyle(mauve)
            } compactTrailing: {
                RestCountdown(state: context.state)
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 48)
                    .foregroundStyle(mauve)
            } minimal: {
                Image(systemName: "timer").foregroundStyle(mauve)
            }
            .keylineTint(mauve)
        }
    }
}
