const uploadFileDialog = document.querySelector(".file-upload-modal");
const closeDialog = document.querySelector(".close-modal-btn");
const inputFileEl = document.querySelector("#upload_file");
const modalTriggerBtn = document.querySelector(".upload-file");
const uploadFileFromEl = document.querySelector("#upload-file-form");
const msgEl = document.querySelector(".msg");
// New Folder Dialog
const addFolderNameDialog = document.querySelector("#add-folder-dialog");
const showButton = document.querySelector(".show-new-folder-dialog");
const closeButton = document.querySelector(".close-add-folder-dialog");
const folderModalFrom = document.querySelector("#add-folder-dialog__form");
// Folder options
const openFolderOptionsBtn = document.querySelectorAll(
  ".open-folder-options-btn"
);
const deleteFolderOptionsBtns = document.querySelectorAll(".delete-folder-btn");

closeDialog.addEventListener("click", (e) => {
  const isFailed = msgEl.classList.contains("failed");
  if (isFailed) {
    msgEl.classList.remove("failed");
  } else {
    msgEl.classList.remove("success");
  }
  msgEl.style.display = "none";
  uploadFileDialog.close();
});

modalTriggerBtn.addEventListener("click", (e) => {
  uploadFileDialog.showModal();
});

uploadFileFromEl.addEventListener("submit", (e) => {
  e.preventDefault();
  async function uploadFile() {
    try {
      const file = document.querySelector("#upload_file").files[0];
      const formData = new FormData();
      formData.append("upload_file", file);
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      msgEl.style.display = "block";
      if (!response.ok) {
        msgEl.classList.add("failed");
        if (msgEl.classList.contains("success")) {
          msgEl.classList.remove("success");
        }
        if (response.status === 500) {
          // file size extends the limit 10mb
          // display error msg to user
          msgEl.textContent =
            "File size exceeds the 10MB limit. Please choose a smaller file.";
          return;
        } else if (response.status === 400) {
          // file not found
          // display error msg to user
          msgEl.textContent = data.error;
          return;
        }
      }
      // file upload successfully
      // display success msg to user
      msgEl.textContent = data.message;
      msgEl.classList.add("success");
      if (msgEl.classList.contains("failed")) {
        msgEl.classList.remove("failed");
      }
      uploadFileFromEl.reset();
    } catch (error) {
      // console.error(error.message);
    }
  }
  uploadFile();
});

// New Folder Dialog
showButton.addEventListener("click", () => {
  addFolderNameDialog.show();
});

closeButton.addEventListener("click", () => {
  folderModalFrom.reset();
  addFolderNameDialog.close();
});

folderModalFrom.addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(folderModalFrom);
  const requestBody = JSON.stringify(Object.fromEntries(formData));
  const parentFolder = e.target.dataset.parentFolderId;

  try {
    fetch(`/library/${parentFolder}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    }).then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    });
  } catch (error) {
    console.error("Network error:", error);
  }
  addFolderNameDialog.close(); // Close the dialog after submission
});

// Folder dialog
openFolderOptionsBtn.forEach(function (btn) {
  btn.addEventListener("click", function (event) {
    const folderOptionsEl = event.currentTarget.parentNode;
    const openFolderDialog = folderOptionsEl.querySelector(
      "#folder-options-dialog"
    );
    // close dialog when click outside
    function handleCloseModalOptions(e) {
      const dialogDimensions = openFolderDialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        openFolderDialog.close();
        e.currentTarget.removeEventListener("click", handleCloseModalOptions);
      }
    }
    window.addEventListener("click", handleCloseModalOptions);
    openFolderDialog.show();
  });
});

deleteFolderOptionsBtns.forEach(function (deleteBtn) {
  deleteBtn.addEventListener("click", function (e) {
    const dataFolderId = e.currentTarget.dataset.folderId;
    console.log("Delete folder btn", dataFolderId);
    // fetch(`/library/${dataFolderId}`, { method: "DELETE" }).then(function (
    //   res
    // ) {});
  });
});
