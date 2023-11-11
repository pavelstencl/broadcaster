
import type { BroadcasterMessage } from "../types";
import { BroadcastChannelBridge } from "./BroadcastChannelBridge";

/**
 * Generates n instances of a Bridge
 * @param amount amount of instances
 * @param channel custom channel name
 * @returns
 */
const createInstance = (
    amount: number,
    channel?: string
): BroadcastChannelBridge<BroadcasterMessage<string>, unknown>[] => new Array(amount)
    .fill(0)
    .map(() => {
        const bridge = new BroadcastChannelBridge<BroadcasterMessage<string>, unknown>();
        bridge.connect(channel || "CHANNEL");

        return bridge;
    });

describe("BroadcastChannel Bridge tests", () => {
    const result = jest.fn();
    let instances:BroadcastChannelBridge<BroadcasterMessage<string>, unknown>[] = [];

    afterEach(() => {
        instances.map((bridge) => bridge.destroy());
        instances = [];
        result.mockReset();
    });

    it("sends simple message to other bridge", (done) => {
        instances = createInstance(2);
        const message = "Hello World";

        instances[1].subscribe({
            messages: (data) => {
                expect(data.payload).toBe(message);
                done();
            },
            state() {
                expect("Called state channel instead of messages channel").toBe(message);
                done();
            },
            onError() {
                expect("Called error channel instead of messages channel").toBe(message);
                done();
            },
        });

        instances[0].postMessage({
            from: "1",
            metadata: {},
            payload: message,
        });
    });

    it("sets a new state and notifies other bridge", (done) => {
        instances = createInstance(2);
        const message = "Hello World";

        instances[1].subscribe({
            messages() {
                expect("Called message channel instead of state channel").toBe(message);
                done();
            },
            state: ({state: {state}}) => {
                expect(state).toBe(message);
                done();
            },
            onError() {
                expect("Called error channel instead of state channel").toBe(message);
                done();
            },
        });

        instances[0].setState({
            from: "1",
            type: 0,
            state: {
                id: "1",
                connectedAt: Date.now(),
                state: message,
            },
        });
    });
});
