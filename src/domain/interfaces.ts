import { User, Project, Link } from './entities';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export interface IProjectRepository {
  create(project: Project): Promise<Project>;
  findAllByUserId(userId: string): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  delete(id: string): Promise<void>;
}

export interface ILinkRepository {
  create(link: Link): Promise<Link>;
  update(link: Link): Promise<Link>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Link | null>;
  findAllByProjectId(projectId: string): Promise<Link[]>;
}

export interface IIdempotencyRepository {
  save(key: string, response: any, expiresAt: Date): Promise<void>;
  find(key: string): Promise<any | null>;
}
