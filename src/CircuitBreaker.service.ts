import { CircuitBreakerStatus } from "./CircuitBreakerStatus.enum";

export class CircuitBreakerService {
    private _state: CircuitBreakerStatus;
    private lastFailureTime: number;
    private _failureCount: number;
    private failureThreshold: number;
    private retryTimePeriod: number;

    // Number of failures we receive from the depended service before we change the state to 'OPEN'

    // Time period after which a fresh request be made to the dependent
    // service to check if service is up.
    constructor(failureThreshold: number, retryTimePeriod: number) {
        // We start in a closed state hoping that everything is fine
        this._state = CircuitBreakerStatus.CLOSED;
        this.lastFailureTime = -1;
        this._failureCount = 0;

        // Number of failures we receive from the depended service before we change the state to 'OPEN'
        this.failureThreshold = failureThreshold;

        // Time period after which a fresh request be made to the dependent
        // service to check if service is up.
        this.retryTimePeriod = retryTimePeriod;
    }

    async call(functionToBeCalled: () => any, target: any, args: []): Promise<any> {
        const statusOperations = {
            [CircuitBreakerStatus.OPEN]: function () {
                const error = {
                    "statusCode": 500,
                    "message": "INTERNAL_SERVER_ERROR"
                }
                throw new Error(JSON.stringify(error))
            },
            [CircuitBreakerStatus.HALF_OPEN]: () => this.executeCall(functionToBeCalled, target, args),
            [CircuitBreakerStatus.CLOSED]: () => this.executeCall(functionToBeCalled, target, args),
        }

        this.setState();
        return await statusOperations[this.state]();
    }

    private async executeCall(target: any, functionToBeCalled: () => any, args: []): Promise<any> {
        try {
            const response = await functionToBeCalled.apply(target, args)
            this.reset();
            return response;
        } catch (err) {
            this.recordFailure();
            throw new Error(err);
        }
    }

    // Reset all the parameters to the initial state when circuit is initialized
    private reset(): void {
        this._failureCount = 0;
        this.lastFailureTime = -1;
        this._state = CircuitBreakerStatus.CLOSED;
    }

    // Set the current state of our circuit breaker.
    private setState(): void {
        if (this.failureThreshold <= this._failureCount) {
            if ((Date.now() - this.lastFailureTime) > this.retryTimePeriod) {
                this._state = CircuitBreakerStatus.HALF_OPEN;
            } else {
                this._state = CircuitBreakerStatus.OPEN;
            }
        } else {
            this._state = CircuitBreakerStatus.CLOSED;
        }
    }

    private recordFailure(): void {
        this._failureCount += 1;
        this.lastFailureTime = Date.now();
    }

    // For Unit-Testing
    public get state() { return this._state }

    public get failureCount() { return this._failureCount }
}
