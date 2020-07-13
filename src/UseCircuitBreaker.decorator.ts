import { CircuitBreakerService } from './CircuitBreaker.service'

// Class decorator
export const UseCircuitBreaker = (failureThreshold = 3, retryTimePeriod = 60000) => {
    return function makeConstructor(constructorFunction: Function): any {
        constructorFunction.prototype.circuitBreakerService = new CircuitBreakerService(failureThreshold, retryTimePeriod)
    }
}