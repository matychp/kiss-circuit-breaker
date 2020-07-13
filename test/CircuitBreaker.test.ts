import { UseCircuitBreaker, IsCall } from "../src"
import { CircuitBreakerStatus } from "../src/CircuitBreakerStatus.enum"
import axios from "axios"

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Circuit Breaker', () => {
  @UseCircuitBreaker()
  class Service {

    @IsCall
    apiCall() {
      return axios.get("http://someurl.com")
    }
  }

  it("should append a Circuit Breaker instance", () => {
    // Check before constructor replacement
    expect(Service.prototype["circuitBreakerService"]).toBeDefined()
    const nestService = new Service();
    // Check after constructor replacement
    expect(nestService["circuitBreakerService"]).toBeDefined()
  })

  it("should be on closed state when it is created", () => {
    const nestService = new Service();
    expect(nestService["circuitBreakerService"].state).toBe(CircuitBreakerStatus.CLOSED)
  })

  it("should call and execute the function decorated", async () => {
    const nestService = new Service();

    const spy = jest.spyOn(nestService, 'apiCall')
    nestService.apiCall()

    expect(spy).toHaveBeenCalled();
    expect(nestService["circuitBreakerService"].failureCount).toBe(0)

    spy.mockRestore()
  })

  it("should return an error and increment the failure count", async () => {
    mockedAxios.get.mockRejectedValue(new Error())
    const nestService = new Service()
    expect(nestService["circuitBreakerService"].failureCount).toBe(0)
    try {
      await nestService.apiCall()
    } catch (e) {
    }
    expect(nestService["circuitBreakerService"].failureCount).toBe(1)
  })

  it("should open the circuit once the failure count reach the failure threshold", async () => {
    const failureThreshold = 1
    const retryTimePeriod = 120000
    @UseCircuitBreaker(failureThreshold, retryTimePeriod)
    class ServiceWithParams {

      @IsCall
      apiCall() {
        return axios.get("http://someurl.com")
      }
    }

    mockedAxios.get.mockRejectedValue(new Error())
    const nestService = new ServiceWithParams()
    expect(nestService["circuitBreakerService"].failureCount).toBe(0)
    try {
      await nestService.apiCall()
    } catch (e) {
    }
    expect(nestService["circuitBreakerService"].failureCount).toBe(1)
    expect(nestService["circuitBreakerService"].state).toBe(CircuitBreakerStatus.CLOSED)
    try {
      await nestService.apiCall()
    } catch (e) {
    }
    expect(nestService["circuitBreakerService"].state).toBe(CircuitBreakerStatus.OPEN)
  })
});
