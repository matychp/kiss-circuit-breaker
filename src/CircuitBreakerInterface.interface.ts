import { CircuitBreakerService } from "CircuitBreaker.service"

export interface CircuitBreakerMethod extends PropertyDescriptor {
    circuitBreakerService: CircuitBreakerService
}