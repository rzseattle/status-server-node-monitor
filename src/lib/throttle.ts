export const throttle = (func: CallableFunction, limit: number) => {
    console.log("[Throttle] Initializet with throttle: " + limit);
    let lastFunc: any;
    let lastRan: number;
    return function () {
        // @ts-ignore
        const context: any = this;
        const args = arguments;
        if (!lastRan) {
            // @ts-ignore
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            // @ts-ignore
            lastFunc = setTimeout(() => {
                if (Date.now() - lastRan >= limit) {
                    // @ts-ignore
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};
