## Déploiement de la chaîne A → B → C sur k3s

**Objectif** : déployer trois services Node.js qui s'appellent en chaîne (A → B → C)
sur un cluster k3s, dans leur propre namespace.

### 1. Les images : un registre local
k3s utilise containerd et ne voit pas les images construites par Docker.
Plutôt que d'importer les images à la main (ce qui demande `sudo`), j'ai lancé un registre local
(`docker run -d -p 5000:5000 registry:2`), puis `docker tag` et `docker push` pour chaque service.
Pourquoi : le cluster peut ainsi télécharger les images comme depuis n'importe quel registre.

### 2. Un namespace dédié
```bash
kubectl create namespace tpk3s
```
Pourquoi : isoler les ressources du TP du reste du cluster, et tout supprimer d'un coup si besoin.

### 3. Un Deployment et un Service par application
Dans `k8s/chain.yaml` :
- **Deployment** : Kubernetes maintient le Pod en vie et le recrée s'il disparaît.
- **Service** : une adresse stable (le nom `service-b`, etc.), car l'IP d'un Pod change à chaque recréation.
  Les services se joignent par leur nom grâce au DNS interne du cluster.
- **Exposition** : seul A est de type NodePort (port 30082), comme dans le `compose.yaml`
  où seul A est joignable depuis l'extérieur ; B et C restent internes.

### 4. La configuration dans une ConfigMap
Les adresses (`NEXT_URL` de A et de B) et le chemin du compteur (`COUNTER_FILE` de C)
sont dans une ConfigMap `chain-config`, injectée avec `configMapKeyRef`.
*Pourquoi : séparer la configuration du code. On peut changer une adresse sans reconstruire
l'image ni modifier le Deployment, et la config est lisible au même endroit.
Une ConfigMap convient parce que ces valeurs ne sont pas sensibles (il n'y a pas de mot de passe,
donc pas de Secret).*

### 5. Le volume de C : un PersistentVolumeClaim
C écrit un compteur dans un fichier. Sans volume, ce fichier est perdu quand le Pod est supprimé.
J'ai créé un PVC `c-data` (100 Mi) monté sur `/data` dans le Pod de C.
*Pourquoi : le PVC demande un stockage durable, indépendant du cycle de vie du Pod.
La taille est obligatoire : elle dit au cluster de quoi on a besoin ; 100 Mi suffit pour un compteur.*

### 6. Déploiement
```bash
kubectl apply -f k8s/ -n tpk3s
```
`kubectl apply` envoie les fichiers YAML à Kubernetes, qui crée ou met à jour les ressources pour que
le cluster corresponde à cette description.
*Pourquoi : c'est le mode déclaratif. On décrit ce qu'on veut dans des fichiers
reproductibles, et Kubernetes se charge de le lancer et de le maintenir.*

### 7. Vérification
```
$ kubectl get pods -n tpk3s
NAME                         READY   STATUS    RESTARTS   AGE
service-a-95c8cb59d-xhz8h    1/1     Running   0          25s
service-b-7998c785d5-4krmx   1/1     Running   0          25s
service-c-767d9bb6d8-tmttx   1/1     Running   0          25s

$ curl http://localhost:30082
[{"name":"Service a"},{"name":"Service b"},{"name":"Service c","count":7}]
```
La requête traverse A, B et C.
**Test de persistance** : après `kubectl delete pod -n tpk3s -l app=service-c`, le Pod est recréé
et le compteur continue au lieu de repartir à zéro.

### 8. Problème rencontré
Au premier déploiement, A et B étaient en `CrashLoopBackOff`. `kubectl logs` a montré
`NEXT_URL is not set` : j'avais oublié la variable d'environnement définie dans le `compose.yaml`.
Je l'ai ajoutée, puis cette configuration a été déplacée dans la ConfigMap.