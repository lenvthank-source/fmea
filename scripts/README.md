# PFD reference and symbol maintenance

- `collect-pfd-references.py <archive-directory>` inventories public Creately PFD guide/usage/catalog links and related engineering templates, deduplicates identities, records exclusions/access limitations and downloads permitted public vector previews. The archive stays outside production assets. It does not claim native editable template access.
- `build-pfd-symbols.py <archive-directory>/inventory.json` generates original application SVGs and identical frontend/backend JSON catalogs plus source coverage. Do not hand-edit registry copies. Exact ISO/ISA/customer glyph conformity remains unverified.

The source archive is recorded in docs/references/pfd-template-inventory.json. Coverage and implementation evidence: docs/specs/pfd-symbols-delivery.md. After changes run README sync and graphify update .; do not commit downloaded source SVG/HTML or credentials.
