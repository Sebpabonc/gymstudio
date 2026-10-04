import Foundation
#if canImport(ActivityKit)
import ActivityKit

/// Live Activity model shared by the app (starts/updates it) and the widget extension (draws it).
@available(iOS 16.1, *)
struct RestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// When the rest ends (used for the live countdown).
        var endDate: Date
        /// Seconds left while paused; nil while counting down.
        var pausedRemaining: Double?
        /// What the user is resting from, e.g. "Dumbbell Bench Press".
        var exercise: String
    }

    var title: String
}
#endif
