import type { IntegrationsApi, ProjectsRepository } from "@/lib/services/contracts";
import { mockIntegrations } from "@/lib/services/mock/integrations";
import { localProjects } from "@/lib/services/mock/projects";

/**
 * Service wiring. This is the only file that decides mock vs. real.
 * Backend phase: import real implementations here and delete the mock imports.
 */
export const projectsService: ProjectsRepository = localProjects;
export const integrationsService: IntegrationsApi = mockIntegrations;
