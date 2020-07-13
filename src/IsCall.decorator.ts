
// Method decorador
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const IsCall = (
    _target: any,
    _propertyName: string,
    propertyDesciptor: PropertyDescriptor): any => {
    // Save the original descriptor
    const fn = propertyDesciptor.value;
    propertyDesciptor.value = async function (...args: any[]): Promise<any> {
        // Execute the function on th(e circuit breaker
        // @ts-ignore
        const result = await this.circuitBreakerService.call(this, fn, args)

        // return the result of invoking the method
        return result;
    }
    return propertyDesciptor;
};
