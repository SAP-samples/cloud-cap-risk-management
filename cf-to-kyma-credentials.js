const fs = require("fs");
const Path = require("path");
const data = fs.readFileSync(0, "utf-8");
const credentials = JSON.parse(data);

// cf service-key cpapp-kyma-db cpapp-kyma-db-key | sed 1,2d

function path(suffix = "") {
    return Path.join("sapcp/hana/cpapp-kyma-db", suffix);
}

fs.mkdirSync(path(), {recursive: true });

for (const key of Object.keys(credentials)) {
    const value = credentials[key];

    fs.writeFileSync(path(key), value);
}
