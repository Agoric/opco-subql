#!/bin/bash

UTF8_FILE="src/types/proto-interfaces/utf8.ts"

if [ -f "$UTF8_FILE" ]; then
    sed -i.bak 's/const chunk = \[\]/const chunk: number[] = \[\]/g' "$UTF8_FILE"
    rm "${UTF8_FILE}.bak"
    echo "Patched $UTF8_FILE"
else
    echo "Patch Failed: $UTF8_FILE not found"
    exit 1
fi
