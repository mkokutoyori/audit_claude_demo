# Guide de Déploiement GitHub Pages

Ce guide explique comment déployer l'application Audit Exception Tracker sur GitHub Pages.

## Déploiement Automatique

L'application est déjà configurée pour GitHub Pages! Suivez ces étapes:

### 1. Activer GitHub Pages

1. Allez sur votre repository GitHub: `https://github.com/mkokutoyori/audit_claude_demo`
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Pages**
4. Sous **Source**, sélectionnez:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Cliquez sur **Save**

### 2. Attendre le Déploiement

- GitHub Pages prend 1-2 minutes pour déployer
- Un message vert apparaîtra avec l'URL: `https://mkokutoyori.github.io/audit_claude_demo/`
- Vous recevrez une notification quand c'est prêt

### 3. Accéder à l'Application

Votre application sera accessible à:
```
https://mkokutoyori.github.io/audit_claude_demo/
```

## Mise à Jour du Déploiement

Pour mettre à jour l'application en production:

```bash
# 1. Basculer sur la branche gh-pages
git checkout gh-pages

# 2. Fusionner les changements depuis votre branche de développement
git merge claude/audit-exception-tracker-app-011CUreTwz8Jg93vzpwNvd1G

# 3. Pousser vers GitHub
git push origin gh-pages
```

GitHub Pages se mettra à jour automatiquement en quelques minutes.

## Configuration Actuelle

- **Branche de déploiement**: `gh-pages`
- **Fichiers déployés**:
  - `index.html` - Page principale
  - `app.js` - Logique applicative
  - `styles.css` - Styles
  - `README.md` - Documentation
  - `CHANGELOG.md` - Historique des changements
  - `.nojekyll` - Désactive Jekyll

## Domaine Personnalisé (Optionnel)

Si vous voulez utiliser votre propre domaine:

1. Créez un fichier `CNAME` avec votre domaine:
   ```
   audit.votredomaine.com
   ```

2. Configurez vos DNS avec les enregistrements suivants:
   ```
   Type: CNAME
   Name: audit (ou votre sous-domaine)
   Value: mkokutoyori.github.io
   ```

3. Dans Settings → Pages → Custom domain, entrez votre domaine

## Vérification

Après le déploiement, vérifiez que:

- ✅ L'application se charge correctement
- ✅ IndexedDB fonctionne (les données sont sauvegardées)
- ✅ Chart.js se charge depuis le CDN
- ✅ Toutes les pages fonctionnent
- ✅ Le responsive design fonctionne sur mobile

## Dépannage

### L'application ne se charge pas

1. Vérifiez que la branche `gh-pages` est bien sélectionnée dans Settings → Pages
2. Attendez 5-10 minutes après le premier déploiement
3. Videz le cache de votre navigateur (Ctrl+F5)
4. Vérifiez la console du navigateur pour les erreurs

### Erreur 404

1. Vérifiez que `index.html` est bien à la racine de la branche `gh-pages`
2. Assurez-vous que le fichier `.nojekyll` existe
3. Vérifiez les paramètres dans Settings → Pages

### Chart.js ne se charge pas

1. Vérifiez votre connexion internet (Chart.js est chargé via CDN)
2. Si problème persiste, téléchargez Chart.js en local:
   ```html
   <script src="chart.min.js"></script>
   ```

### Les données ne persistent pas

- C'est normal: IndexedDB stocke les données par domaine
- Les données de `localhost` ne sont pas transférées vers GitHub Pages
- Les utilisateurs devront recréer leurs données sur le site déployé

## Avantages de GitHub Pages

✅ **Gratuit** - Hébergement illimité pour les sites publics
✅ **HTTPS** - Certificat SSL automatique
✅ **CDN** - Distribution mondiale rapide
✅ **Pas de serveur** - Pas de maintenance backend
✅ **Mises à jour faciles** - Simple git push

## Limitations

⚠️ **Sites publics uniquement** (sauf avec GitHub Pro)
⚠️ **Pas d'exécution backend** (mais pas nécessaire pour cette app)
⚠️ **Limite de 1GB** pour le repository
⚠️ **Limite de 100GB/mois** de bande passante (largement suffisant)

## Alternatives de Déploiement

Si GitHub Pages ne convient pas, vous pouvez aussi déployer sur:

- **Netlify**: Glissez-déposez les fichiers
- **Vercel**: Connectez votre repo GitHub
- **Cloudflare Pages**: Déploiement automatique
- **Firebase Hosting**: Hébergement de Google
- **AWS S3 + CloudFront**: Solution professionnelle

Toutes ces options fonctionnent car l'application est 100% client-side!

## Support

Pour toute question sur le déploiement:
1. Consultez la [documentation GitHub Pages](https://docs.github.com/pages)
2. Vérifiez les logs dans Actions (si activé)
3. Ouvrez une issue sur le repository

---

**Note**: Cette application utilise IndexedDB pour le stockage local. Les données sont stockées dans le navigateur de chaque utilisateur et ne sont pas synchronisées entre appareils.
