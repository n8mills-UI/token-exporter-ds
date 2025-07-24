#!/bin/bash

# Wrapper script for lint-staged to run audit:docs in warning mode
# This version shows warnings but doesn't fail the commit

npm run audit:docs || echo "⚠️  Documentation audit found issues but allowing commit to proceed"