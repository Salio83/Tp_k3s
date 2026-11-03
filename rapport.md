## Déploiement de la chaîne de services sur k3s

### 1. Contexte et architecture
L'application est composée de trois services Node.js (`service-a`, `service-b`, `service-c`)
qui s'appellent en chaîne. Seul `service-a` est exposé à l'extérieur (port 8082),
`service-b` (8081) et `service-c` (8080) ne sont accessibles qu'en interne.

l'objectif est de la déployer sur un cluster Kubernetes 
dans un namespace dédié, `tp`.

