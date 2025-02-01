import { useContext, useEffect, useState } from 'react';
import { Alert, Box, Divider, Link, List, ListItem, ListItemButton, ListItemText, Skeleton, Stack } from '@mui/material';
import { Profile, ProfileContext } from './../../shared/ProfileContext';
import { httpGet } from './../../shared/HttpApi';
import TopBar from '../../shared/TopBar';
import WorkSpace from '../../shared/WorkSpace';
import { Grid2, GridModal } from '../../shared/Modals';

type View = 'main' | 'details' | 'settings';

interface ViewInfo {
  name: View;
  display: string;
}

function ListViews(props: { view: View, onSelect: (item: View) => void }) {
  const views: ViewInfo[] = [
    { name: 'main', display: "Main" },
    { name: 'details', display: "Details" },
    //{ name: 'settings', display: "Settings" },
  ];

  const viewList = views.map(view => (
    <ListItem key={view.name} disablePadding>
      <ListItemButton selected={props.view === view.name} onClick={() => {
        props.onSelect(view.name);
      }}>
        <ListItemText primary={view.display} />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <Grid2 xs={3}>
      <List>
        {viewList}
      </List>
    </Grid2>
  );
}

function Header(props: { children: string }) {
  return <Box sx={{ display: 'block', fontSize: '1.3em', fontWeight: 'bold', textAlign: 'center' }}>{props.children}</Box>;
}

function MainView() {
  return (
    <Stack spacing={4}>
      <Header>Welcome to the MainHub</Header>
      <Box sx={{ textAlign: 'justify' }}>
        You have been granted access to our most advanced service, designed as transition to other services.
        <br />
        <br />
        Feel free to explore :)
      </Box>
    </Stack>
  );
}

function ServiceLink(props: { href: string, alignRight?: boolean, children: string }) {
  return (
    <Grid2 xs={6} sx={{ textAlign: props.alignRight ? 'right' : 'left' }}>
      <Link href={props.href} underline="hover" rel="noreferrer">{props.children}</Link>
    </Grid2>
  );
}

function ServiceSkeleton() {
  return (
    <Grid2 xs={5}>
      <Skeleton />
    </Grid2>
  );
}

function DetailsView() {
  const profile = useContext(ProfileContext);

  let profileName;
  let profileDiscordId;
  let serviceList;

  if (profile != null) {
    profileName = profile.name;
    profileDiscordId = profile.discordId;

    let serviceLinkAlignRight = true;
    serviceList = profile!.services.map(value => {
      serviceLinkAlignRight = !serviceLinkAlignRight;
      return <ServiceLink key={value.name} href={value.link} alignRight={serviceLinkAlignRight}>{value.name}</ServiceLink>;
    });
  } else {
    profileName = <Skeleton />;
    profileDiscordId = <Skeleton />;

    serviceList = [];
    for (let i = 0; i < 9;) {
      serviceList.push(<ServiceSkeleton key={i++} />);
      serviceList.push(<Grid2 xs={2} key={i++} />);
      serviceList.push(<ServiceSkeleton key={i++} />);
    }
  }

  return (
    <Stack spacing={2}>
      <Header>Account Details</Header>
      <Grid2 container>
        <Grid2 xs={4}>Name:</Grid2>
        <Grid2 xs={8} sx={{ textAlign: 'right' }}>{profileName}</Grid2>
        <Grid2 xs={4}>Discord:</Grid2>
        <Grid2 xs={8} sx={{ textAlign: 'right' }}>{profileDiscordId}</Grid2>
      </Grid2>

      <Divider />

      <Header>Services</Header>
      <Grid2 container>
        {serviceList}
      </Grid2>
    </Stack>
  );
}

function GridLink(props: { href: string, alignRight?: boolean, children: string }) {
  return (
    <Grid2 xs={6} sx={{ textAlign: props.alignRight ? 'right' : 'left' }}>
      <Link href={props.href} underline="hover" rel="noreferrer">{props.children}</Link>
    </Grid2>
  );
}

function SettingsView() {
  return (
    <Stack spacing={3}>
      <Grid2 container spacing={1}>
        <Grid2 xs={12}><Header>Account</Header></Grid2>
        <Grid2 xs={12}>Change Name</Grid2>
        <Grid2 xs={12}>Request Account Deletion</Grid2>
      </Grid2>

      <Grid2 container spacing={1}>
        <Grid2 xs={12}><Header>Agreements</Header></Grid2>
        <GridLink href='/tos'>Terms of Service</GridLink>
        <GridLink href='/pp' alignRight>Privacy Policy</GridLink>
        <Grid2 xs={12} sx={{ textAlign: 'center' }}>Accepted on: August 17th 2007</Grid2>
      </Grid2>
    </Stack>
  );
}

function SelectedView(props: { view: View }) {
  if (props.view === 'main') {
    return <MainView />;
  } else if (props.view === 'details') {
    return <DetailsView />;
  } else if (props.view === 'settings') {
    return <SettingsView />;
  }
}

function AlertPage(props: { children: string | null }) {
  if (props.children == null) {
    return <></>;
  }
  return <Alert severity="error" variant="filled">{props.children}</Alert>;
}

function Page() {
  const [state, setState] = useState((): View => 'main');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  
  useEffect(() => {
    const [promise, controller] = httpGet<Profile>(`${import.meta.env.BASE_URL}api/user`);
    
    promise.then((value) => {
      setProfile(value);
      setPageError(null);
    }).catch((err: unknown) => {
      const error = err as Error;
      console.error(`Failed to get user profile: ${error.message}`);
      setProfile(null);
      setPageError('Your profile is not available at the moment. Please try again later');
    });

    return () => {
      controller.abort();
    };
  }, []);
  
  return (
    <ProfileContext.Provider value={profile}>
      <TopBar title="Dashboard" loggedIn />
      <WorkSpace>
        <AlertPage>{pageError}</AlertPage>
        <GridModal width={600} height={400} color="#222222">
          <ListViews view={state} onSelect={setState} />
          <Divider orientation='vertical' flexItem />
          <Grid2 xs={1} />
          <Grid2 xs={7}>
            <SelectedView view={state} />
          </Grid2>
        </GridModal>
      </WorkSpace>
    </ProfileContext.Provider>
  );
}

export default Page;
