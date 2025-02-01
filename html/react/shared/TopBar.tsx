import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import IconButton from "@mui/material/IconButton";

function TopBar(props: { title: string, loggedIn?: boolean }) {
  function onLogOut() {
    const url = `${import.meta.env.BASE_URL}logout`;
    window.location.assign(url);
  }

  let logoutButton;
  if (props.loggedIn) {
    logoutButton = (
      <IconButton size="large" color="error" onClick={onLogOut}>
          <LogoutIcon />
      </IconButton>
    );
  } else {
    logoutButton = <></>;
  }

  return (
    <AppBar position="fixed">
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {props.title}
            </Typography>
            {logoutButton}
        </Toolbar>
    </AppBar>
  );
}

export default TopBar;
