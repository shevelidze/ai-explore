interface ServerComponentProps<
  S = { [key: string]: string | string[] | undefined } | undefined,
  P = undefined
> {
  params: P;
  searchParams: S;
}

export type { ServerComponentProps };
