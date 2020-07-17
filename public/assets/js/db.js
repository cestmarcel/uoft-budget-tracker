// Set up indexedDB
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// Open the budget database
let db;
const req = indexedDB.open("budget", 1);

// If there is no budget, create objectStore called "pending"
req.onupgradeneeded = function(evt){
  let db = evt.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// If it opens successfully and if navigator is online, check database (get transactions etc.)
req.onsuccess = function(evt){
  db = evt.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

// If error, log error
req.onerror = function(evt) {
  console.log("Oh no! There was an error" + evt.target.errorCode);
};

// Open object store and save record
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");

  store.add(record);
}

// As soon as app is online, do a bulk upload to the database
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then( function(){
        const pendingRecord = db.transaction(["pending"], "readwrite");
        const store = pendingRecord.objectStore("pending");
        store.clear();
      });
    }
  };
}

// Add event listener to check when app is back online
window.addEventListener("online", checkDatabase);