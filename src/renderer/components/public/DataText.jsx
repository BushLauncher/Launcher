export default function DataTextComponent({ data }) {
  //in try catch to make the web preview work
  try {
    switch (data) {
      case 'app-version':
        return window.electron.version.app()
      default:
        return 'wrong "data" value'
    }
  } catch (err) {
    console.error("we couldn't return the data text, be cause of an error:");
    console.error(err);
    return 'Err'
  }
}
