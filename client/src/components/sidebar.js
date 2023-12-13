// import React, { useEffect, useState } from "react";

// function SideBar() {
//     return (
//       <div className="sidebar">
//         <a id="questions" href="#">
//             Questions
//         </a>
//         <a id="tags" href="#">
//             Tags
//         </a>
//       </div>
//     )
// }

// export default SideBar;

import React, { useState } from "react";
import TagsPage from "./tagspage";
import HomePage from "./homepage";

function SideBar() {
  const [selectedPage, setSelectedPage] = useState("questions");

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-links">
        <button onClick={() => handlePageChange("questions")} id="questions">
          Questions
        </button>
        <button onClick={() => handlePageChange("tags")} id="tags">
          Tags
        </button>
      </div>
      <div className="content">
        {selectedPage === "questions" && (
          <div>
            {/* <h1>Questions Page</h1> */}
            <HomePage/>
          </div>
        )}
        {selectedPage === "tags" && (
          <div>
            {/* <h1>Tags Page</h1> */}
            <TagsPage/>
          </div>
        )}
      </div>
    </div>
  );
}

export default SideBar;
