import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

/// Capacitor bridge for the rest-timer Live Activity (Dynamic Island + lock screen).
/// JS: registerPlugin('RestTimerActivity') — see src/native/restTimerActivity.ts.
@objc(RestTimerActivityPlugin)
public class RestTimerActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RestTimerActivityPlugin"
    public let jsName = "RestTimerActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            call.resolve(["available": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { return call.resolve() }
        let state = contentState(call)
        Task {
            await endAll()
            do {
                _ = try Activity.request(
                    attributes: RestTimerAttributes(title: "Rest"),
                    content: ActivityContent(state: state, staleDate: state.endDate.addingTimeInterval(60)),
                    pushType: nil
                )
                call.resolve()
            } catch {
                call.reject("Could not start the rest Live Activity: \(error.localizedDescription)")
            }
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { return call.resolve() }
        let state = contentState(call)
        Task {
            for activity in Activity<RestTimerAttributes>.activities {
                await activity.update(ActivityContent(state: state, staleDate: state.endDate.addingTimeInterval(60)))
            }
            call.resolve()
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { return call.resolve() }
        Task {
            await endAll()
            call.resolve()
        }
    }

    @available(iOS 16.2, *)
    private func endAll() async {
        for activity in Activity<RestTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    @available(iOS 16.2, *)
    private func contentState(_ call: CAPPluginCall) -> RestTimerAttributes.ContentState {
        let endAtMs = call.getDouble("endAt") ?? Date().timeIntervalSince1970 * 1000
        let pausedMs = call.getDouble("pausedRemainingMs")
        return RestTimerAttributes.ContentState(
            endDate: Date(timeIntervalSince1970: endAtMs / 1000),
            pausedRemaining: pausedMs.map { $0 / 1000 },
            exercise: call.getString("exercise") ?? "Rest"
        )
    }
}
