const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GH_TOKEN = process.env.GH_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;

const STATUS_FIELD_NAME = "Status";
const STATUS_OPTIONS = [
  {name: "To Do"},
  {name: "In Progress"},
  {name: "Done"}
];

async function githubGraphQL(query, variables) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query, variables}),
  });
  const data = await response.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

async function getProjectFields(projectId) {
  const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              id
              name
              dataType
            }
          }
        }
      }
    }
  `;
  const result = await githubGraphQL(query, {projectId});
  return result.node.fields.nodes;
}

async function createStatusField(projectId) {
  const mutation = `
    mutation ($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      createProjectV2SingleSelectField(input: {
        projectId: $projectId,
        name: $name,
        options: $options
      }) {
        projectV2SingleSelectField {
          id
          name
        }
      }
    }
  `;
  const result = await githubGraphQL(mutation, {
    projectId,
    name: STATUS_FIELD_NAME,
    options: STATUS_OPTIONS
  });
  return result.createProjectV2SingleSelectField.projectV2SingleSelectField;
}

(async () => {
  if (!GH_TOKEN || !PROJECT_ID) {
    console.error('Missing GH_TOKEN or PROJECT_ID env vars.');
    process.exit(1);
  }

  const fields = await getProjectFields(PROJECT_ID);
  const statusField = fields.find(f => f.name === STATUS_FIELD_NAME && f.dataType === "SINGLE_SELECT");
  if (statusField) {
    console.log(`Field "${STATUS_FIELD_NAME}" already exists.`);
  } else {
    const createdField = await createStatusField(PROJECT_ID);
    console.log(`Created field "${createdField.name}".`);
  }
})();
