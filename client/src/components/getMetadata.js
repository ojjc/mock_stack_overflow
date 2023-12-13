function GetMetadata({date}) {
    const now = new Date();
    const timeDiff = now - date;
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // format the answer date metadata based on the time elapsed
    let metadata = "";
    if (days < 1) {
      if (hours < 1) {
        if (minutes < 1) {
          metadata = `${seconds} seconds ago`;
        } else {
          metadata = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        }
      } else {
        metadata = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      }
    } else if (days === 1) {
      metadata = "yesterday";
    } else if (days < 365) {
      metadata = `${days} days ago`;
    } else {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      };
      metadata = date.toLocaleDateString(undefined, options);
    }
    return metadata;
  }

  export default GetMetadata;