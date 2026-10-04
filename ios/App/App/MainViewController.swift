import UIKit
import Capacitor

/// Registers GymStudio's local native plugins with the Capacitor bridge.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(RestTimerActivityPlugin())
    }
}
