# Architecture rules
- Keep project-hours aggregation in a pure utility, separate from its view, so split allocations and period totals can be tested independently.
- Read planning through PlanningContext; synthetic secondary rows must not double-count primary-row secondary fields.