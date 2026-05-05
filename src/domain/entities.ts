export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string
  ) {}
}

export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly userId: string
  ) {}
}

export interface LinkParameter {
  key: string;
  value: string;
}

export interface RedirectConfig {
  destinationUrl: string;
}

export class Link {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseUrl: string,
    public readonly projectId: string,
    public readonly parameters: LinkParameter[] = [],
    public readonly redirect?: RedirectConfig
  ) {}
}
