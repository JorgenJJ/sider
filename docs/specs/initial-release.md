# Spec: Initial release

> **Status:** Draft | Ready for implementation | In progress | Done  
> **Author:** [Your name]  
> **Created:** YYYY-MM-DD  
> **Last updated:** YYYY-MM-DD

---

## Overview

<!--
One paragraph. What are we building, and why? Give enough context for someone
who has never seen this codebase to understand the purpose.
-->

Sider is a project name for a simple app for rating apple cider. The main principles are ease of usage, quick interaction and a simple overview of tasted ciders. The initial app has no online connections, and is entierly located on a users device. The purpose is to log the look, smell, feel and flavour of various Norwegian ciders. Available langauges should be Norwegian Bokmål and Norwegian Nynorsk. 

## Goals

<!--
What this feature must achieve. Be specific and outcome-oriented.
-->

- Write short notes about a cider for various categories, possibly with some help and suggestions (note: should not be intrusive)
- See an overview of tasted ciders and producers
- Fast and responsive design without clutter

## Possible goals

<!--
What this feature could achieve.
-->

- Image processing to register cider name and brand

## Non-goals

<!--
Explicitly call out what is OUT of scope. This prevents scope creep and tells
the agent what NOT to implement.
-->

- Any social network features
- Any made up list of ciders and producers (this could be sourced in a future release)

## Functional requirements

<!--
What the system must DO. Use numbered requirements so they can be referenced
in acceptance criteria and code comments. Be precise — avoid "should" in favour
of "must" for hard requirements.
-->

1. **REQ-01** The system must gracefully handle the app being linked and opened in one browser (e.g. Messenger), before being opened in another (e.g. Safari/Chrome)
2. **REQ-02** The system must be mobile friendly
3. **REQ-03** The system be free to host
4. **REQ-04** The system must be hosted and deployed in GitHub
5. **REQ-05** The system must be hosted in Cloudflare

## References

<!--
Links to related specs, tickets, PRs, or external docs.
-->

- [Related spec](./TEMPLATE.md)
