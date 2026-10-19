# Architecture rules
- Keep project-hours aggregation in a pure utility, separate from its view, so split allocations and period totals can be tested independently.
- Keep project matrix capacity summaries in a pure utility; raw productive totals match project cells while utilization caps each person's contribution independently to available capacity.
- Read planning through PlanningContext; synthetic secondary rows must not double-count primary-row secondary fields.