import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

export default function Comments(): JSX.Element {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
}
