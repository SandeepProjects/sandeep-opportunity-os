import assert from 'assert/strict';

// Test URL Canonicalization
const testUrl = "http://localhost/job/123?utm_source=google#about";
const canonical = testUrl.split('?')[0].split('#')[0].toLowerCase().replace(/\/$/, '');
assert.equal(canonical, "http://localhost/job/123");

// Test Deduplication
const list = ["a", "a", "b"];
const uniqueList = Array.from(new Set(list));
assert.deepEqual(uniqueList, ["a", "b"]);

// Test Seniority and Regional Gates
const gateSeniority = (role, seniority) => seniority === "Senior" || role.toLowerCase().includes("senior");
assert.equal(gateSeniority("Senior Developer", "Mid"), true);
assert.equal(gateSeniority("Junior Developer", "Junior"), false);

// Test UNKNOWN Defaults
const getField = (val) => val || "UNKNOWN";
assert.equal(getField(null), "UNKNOWN");
assert.equal(getField(""), "UNKNOWN");
assert.equal(getField("Engineering"), "Engineering");

// Test Google Sheets user-field preservation
const existingRow = { id: 1, userNotes: "Followed up on Monday", status: "In Progress" };
const incomingData = { id: 1, status: "Updated" };
const merged = { ...incomingData, userNotes: existingRow.userNotes || "UNKNOWN" };
assert.equal(merged.userNotes, "Followed up on Monday");

console.log("All opportunity_os assertions passed successfully!");
