type FunctionExtended = (...rest: any[]) => any;
export type TupleToUnion<T extends any[]> = T[number];
export type GetSecondArgument<T extends any[]> = T[1];
export type Nullable = undefined | null | never | void;
export type ParametersWithArg<Fn = (...args: any[]) => any> = Fn extends (...args: infer Args) => any ? GetSecondArgument<Args> extends Nullable ? Array<TupleToUnion<Args>> : Array<Args> : never;
type MapKeys = 'queue' | 'processed';
type Options = {
    isAborted: boolean;
};
export declare class CreateAsyncQueue<Iteration extends FunctionExtended = FunctionExtended, Props extends ParametersWithArg<Iteration> = ParametersWithArg<Iteration>> {
    queue: Map<MapKeys, Set<Props>>;
    queueSet: Set<Props>;
    processedSet: Set<Props>;
    options: Options;
    useIteration: Iteration;
    iterationProps: Props;
    constructor(useIteration: Iteration, iterationProps: Props);
    private initialization;
    private getQueue;
    private getProcessed;
    private bindFunctions;
    private fillQueue;
    private gen;
    run<Fn extends (args: ReturnType<Iteration>) => any>(callback?: Fn): Promise<ReturnType<Fn>[]>;
    private setToDefault;
    getProcessedData(): Props[];
    getQueueData(): Props[];
    resetAll(iterationProps: Props): void;
    stop(): this;
    resume(): Promise<any[] | this>;
    push(data: Props): this;
}
export {};
/**
 * @tests
 */
