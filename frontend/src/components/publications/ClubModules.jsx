import EntityModules from "./EntityModules";

// Área modular da página de UM clube (abaixo da testeira fixa). Ver EntityModules.jsx.
export default function ClubModules({ clubId, club, ...rest }) {
  return <EntityModules kind="club" entityKey={clubId} entity={club} {...rest} />;
}
