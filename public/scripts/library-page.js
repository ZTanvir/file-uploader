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
const openFolderOptionsBtns = document.querySelectorAll(
  ".open-folder-options-btn"
);
const updateFolderOptionsBtns = document.querySelectorAll(".update-folder-btn");
const deleteFolderOptionsBtns = document.querySelectorAll(".delete-folder-btn");
// rename folder
const folderRenameModal = document.querySelector("#folder-rename-modal");
const folderRenameCloseBtn = document.querySelector(
  ".close-rename-folder-modal-btn"
);
// File options
const openFileOptionsBtns = document.querySelectorAll(".open-file-options-btn");
const downloadFileOptionsBtns = document.querySelectorAll(".download-file-btn");
const updateFileOptionsBtns = document.querySelectorAll(".update-file-btn");
const deleteFileOptionsBtns = document.querySelectorAll(".delete-file-btn");
// rename file
const fileRenameModal = document.querySelector("#file-rename-modal");
const fileRenameCloseBtn = document.querySelector(
  ".close-rename-file-modal-btn"
);
// Previous page
const redirectPreviousPage = document.querySelector(".redirect-previous-page");
if (redirectPreviousPage) {
  redirectPreviousPage.addEventListener("click", function (e) {
    window.history.back();
  });
}
// upload dialog
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
  const parentFolderId = e.currentTarget.dataset.parentFolderId;

  async function uploadFile() {
    try {
      const file = document.querySelector("#upload_file").files[0];
      const formData = new FormData();
      formData.append("upload_file", file);
      const response = await fetch(`/upload/${parentFolderId}`, {
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
        } else if (response.status === 409) {
          msgEl.textContent = data.error;
          return;
        }
      } else if (response.ok) {
        // file upload successfully
        // display success msg to user
        msgEl.textContent = data.message;
        msgEl.classList.add("success");
        if (msgEl.classList.contains("failed")) {
          msgEl.classList.remove("failed");
        }
        window.location.reload();
        uploadFileFromEl.reset();
      }
    } catch (error) {
      console.error(error.message);
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

  fetch(`/library/folder/${parentFolder}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    })
    .catch((error) =>
      console.error("Network error on creating new folder:", error)
    );

  addFolderNameDialog.close(); // Close the dialog after submission
});

// Folder dialog
openFolderOptionsBtns.forEach(function (btn) {
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

updateFolderOptionsBtns.forEach(function (updateBtn) {
  updateBtn.addEventListener("click", function (e) {
    const dataFolderId = e.currentTarget.dataset.folderId;
    const dataFolderName = e.currentTarget.dataset.folderName;
    const modalFormEl = folderRenameModal.querySelector("#folder-rename-form");
    const modalFormInputEl = folderRenameModal.querySelector(
      "#updated-folder-name"
    );
    folderRenameModal.showModal();

    // folder old name
    modalFormInputEl.focus();
    modalFormInputEl.value = dataFolderName;
    function updateFolderName(e) {
      e.preventDefault();
      fetch(`/library/folder/${dataFolderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newFolderName: modalFormInputEl.value,
        }),
      })
        .then((res) => {
          if (res.ok) {
            window.location.reload();
          }
        })
        .catch((error) => console.error(error));

      folderRenameModal.close();
      modalFormEl.removeEventListener("submit", updateFolderName);
    }
    // every edit folder will not add a new submit event
    modalFormEl.addEventListener("submit", updateFolderName);
  });
});

deleteFolderOptionsBtns.forEach(function (deleteBtn) {
  deleteBtn.addEventListener("click", function (e) {
    const dataFolderId = e.currentTarget.dataset.folderId;
    fetch(`/library/folder/${dataFolderId}`, { method: "DELETE" }).then(
      function (response) {
        if (response.ok) {
          window.location.reload();
        }
      }
    );
  });
});

// File dialog
openFileOptionsBtns.forEach(function (btn) {
  btn.addEventListener("click", function (event) {
    const fileOptionsEl = event.currentTarget.parentNode;
    const openFileDialog = fileOptionsEl.querySelector("#file-options-dialog");
    // close dialog when click outside
    function handleCloseModalOptions(e) {
      const dialogDimensions = openFileDialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        openFileDialog.close();
        e.currentTarget.removeEventListener("click", handleCloseModalOptions);
      }
    }
    window.addEventListener("click", handleCloseModalOptions);
    openFileDialog.show();
  });
});

updateFileOptionsBtns.forEach(function (updateBtn) {
  updateBtn.addEventListener("click", function (e) {
    const dataFileId = e.currentTarget.dataset.fileId;
    const dataFileName = e.currentTarget.dataset.fileName;
    const modalFormEl = fileRenameModal.querySelector("#file-rename-form");
    const modalFormInputEl =
      fileRenameModal.querySelector("#updated-file-name");
    fileRenameModal.showModal();

    // folder old name
    modalFormInputEl.focus();

    modalFormInputEl.value = dataFileName;
    function updateFileName(e) {
      e.preventDefault();
      fetch(`/library/file/${dataFileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newFileName: modalFormInputEl.value,
        }),
      })
        .then((res) => {
          if (res.ok) {
            window.location.reload();
          }
        })
        .catch((error) => console.error(error));

      folderRenameModal.close();
      modalFormEl.removeEventListener("submit", updateFileName);
    }
    // every edit folder will not add a new submit event
    modalFormEl.addEventListener("submit", updateFileName);
  });
});

deleteFileOptionsBtns.forEach(function (deleteBtn) {
  deleteBtn.addEventListener("click", function (e) {
    const dataFileId = e.currentTarget.dataset.fileId;
    fetch(`/library/file/${dataFileId}`, { method: "DELETE" }).then(function (
      response
    ) {
      if (response.ok) {
        window.location.reload();
      }
    });
  });
});

// folder rename dialog
folderRenameCloseBtn.addEventListener("click", function (e) {
  folderRenameModal.close();
});

// file rename dialog
fileRenameCloseBtn.addEventListener("click", function (e) {
  fileRenameModal.close();
});
