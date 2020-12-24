import * as Spacely from '../../../src';
import { Space } from '../../../src/space';

const serverSpace = Spacely.listen<any>(4321);
serverSpace.onJoin((from: Spacely.Client) => {

});