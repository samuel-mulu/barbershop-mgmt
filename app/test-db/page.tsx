"use client";
import { useState } from "react";

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("list-users");
  const [phone, setPhone] = useState("");

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-db", {
        method: "GET"
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async () => {
    setLoading(true);
    try {
      const body: any = { action };
      
      if (action === "find-user") {
        body.data = { phone };
      }
      
      const response = await fetch("/api/test-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">Database Test Page</h1>
        
        {/* Test Database Connection */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Test Database Connection</h2>
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Test Database Operations</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Action:</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="list-users">List Users</option>
              <option value="list-branches">List Branches</option>
              <option value="create-test-user">Create Test User</option>
              <option value="create-test-branch">Create Test Branch</option>
              <option value="find-user">Find User by Phone</option>
            </select>
          </div>

          {action === "find-user" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone Number:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <button
            onClick={performAction}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Execute Action"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

