## Déploiement sur k3s

**Objectif** : déployer les 3 services (a → b → c) sur un cluster k3s, dans un namespace dédié.

**Étapes**

1. **Images** : k3s ne voit pas les images Docker locales, donc je les ai envoyées dans un registre local
   (`docker run -d -p 5000:5000 registry:2`, puis `docker tag` et `docker push` pour chaque service).
2. **Manifestes** : j'ai écrit `k8s/chain.yaml` avec, pour chaque service, un Deployment (les Pods)
   et un Service (une adresse stable). `service-a` est exposé en NodePort (30082),
   les deux autres restent internes.
3. **Configuration** : `service-a` et `service-b` ont besoin de la variable `NEXT_URL`
   (adresse du service suivant), que j'ai reprise du `compose.yaml` dans une section `env:`.
4. **Déploiement** :
   ```bash
   kubectl create namespace tpk3s
   kubectl apply -f k8s/ -n tpk3s
   ```
   kubectl apply envoie à Kubernetes les fichiers YAML qui décrivent nos services, et Kubernetes crée ou met à jour les Pods et les Services dans le namespace tpk3s pour que le cluster corresponde à cette description. 
   On fait ça pour déployer l’application de façon reproductible : on décrit ce qu’on veut dans des fichiers, et Kubernetes se charge de le lancer et de le maintenir en fonctionnement.

**Résultat**
```
$ kubectl get pods -n tpk3s
NAME                         READY   STATUS    RESTARTS   AGE
service-a-5c6f9c7b54-7whp9   1/1     Running   0          2m28s
service-b-6555cd477d-tw8pw   1/1     Running   0          2m28s
service-c-546b698bb8-cd4qx   1/1     Running   0          6m32s

$ curl http://localhost:30082
[{"name":"Service a"},{"name":"Service b"},{"name":"Service c","count":3}]
```
Les 3 Pods tournent et la requête traverse toute la chaîne.

**Problème rencontré** : au premier déploiement, `service-a` et `service-b` plantaient
(`CrashLoopBackOff`). `kubectl logs` a montré `NEXT_URL is not set` : j'avais oublié
la variable d'environnement. Après l'avoir ajoutée, j'ai refait `kubectl apply`.