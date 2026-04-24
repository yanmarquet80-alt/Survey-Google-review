# Security — Google Reviews Dashboard

## État actuel (phase dev — avril 2026)

### ⚠️ Dette technique assumée

| Item | État | Risque | Plan |
|------|------|--------|------|
| **RLS** (Row Level Security) | ❌ Désactivé sur `review_*` | Anyone avec la clé anon peut lire/écrire | Activer en même temps que Supabase Auth |
| **Authentification** | ❌ Aucune | Dashboard 100% public | Ajouter Supabase Auth (email/magic link) avant 1er client payant |
| **Multi-tenant isolation** | ⚠️ FK `business_id` uniquement (logique applicative) | Si bug dans une query → fuite cross-tenant | Activer RLS avec policy `auth.uid() = business.owner_uid` |
| **Projet Supabase mutualisé** | ⚠️ Cohabite avec RAG + Leads dans `fsvprjyqwmsoioetogky` | Inacceptable pour revente | Projet Supabase dédié par client en prod |

### Pourquoi ces choix maintenant

- **Phase dev solo** : pas de données réelles de tiers
- **RLS sans Auth = tout bloqué** : la clé anon n'a aucun user identifié
- **Projet Free Supabase limité à 2** : impossible d'isoler tant que pas de revenu

## ✅ Avant le 1er client payant — checklist obligatoire

- [ ] Créer un projet Supabase **dédié** (`google-reviews-saas-CLIENT_NAME`)
- [ ] Appliquer `schema.sql` (préfixe `review_` peut être retiré dans projet dédié)
- [ ] Implémenter Supabase Auth (magic link recommandé pour pros non-tech)
- [ ] Activer RLS sur les 3 tables avec policies basées sur `auth.uid()`
- [ ] Ajouter colonne `owner_uid uuid references auth.users(id)` sur `review_businesses`
- [ ] Restreindre policy : `auth.uid() = owner_uid` pour SELECT/UPDATE/DELETE
- [ ] Audit OWASP Top 10 sur les routes API
- [ ] Activer le plan Supabase Pro ($25/mois) — backups, pas de pause

## 📦 Variables d'environnement sensibles

| Var | Où | Sensibilité |
|-----|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | 🟢 Public (préfixe `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | 🟡 Public mais limité par RLS (à terme) |
| `N8N_WEBHOOK_URL` | Vercel + `.env.local` | 🟡 Server-only, à protéger |
| `SUPABASE_SERVICE_ROLE_KEY` | n8n uniquement | 🔴 **Jamais** dans le repo ni Vercel |

## 🚨 En cas d'incident

1. **Fuite de la clé anon** : régénérer dans Supabase Studio → Settings → API
2. **Webhook n8n public** : ajouter un header `x-webhook-secret` partagé
3. **Compromission compte Vercel** : rotation immédiate des 3 env vars
