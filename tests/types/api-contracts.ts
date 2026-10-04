import request from '../../src/Utils/API/request';
import cApi from '../../src/Utils/API/c-api';
import mApi from '../../src/Utils/API/m-api';
import { fileUpload, fileUploadWithoutMD5 } from '../../src/Utils/fileUpload';
import { aiPlatform } from '../../src/Utils/API/ai-platform';
import { aiWorkbench } from '../../src/Utils/API/ai-workbench';
import { AutoLabPage, JavaPage } from '../../src/Type/api';

type IsAny<Value> = 0 extends 1 & Value ? true : false;
type IsEqual<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type AssertFalse<Value extends false> = Value;
type AssertTrue<Value extends true> = Value;

export type ApiTypeContracts = {
  defaultGetIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof request.get>>>>;
  defaultPostIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof request.post>>>>;
  profileIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof cApi.getProfile>>>>;
  profileFeaturesAreNotAny: AssertFalse<
    IsAny<NonNullable<Awaited<ReturnType<typeof cApi.getProfile>>['features']>>
  >;
  fileIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof fileUploadWithoutMD5>>>>;
  batchFileIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof fileUpload>>[number]>>;
  contestRowIsNotAny: AssertFalse<
    IsAny<Awaited<ReturnType<typeof cApi.getContestList>>['rows'][number]>
  >;
  managedContestIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof mApi.getContest>>>>;
  rankRowIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof cApi.getRank>>[number]>>;
  problemSetIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof cApi.getProblemSetInfo>>>>;
  jobIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof aiPlatform.job>>>>;
  resourceIsNotAny: AssertFalse<IsAny<Awaited<ReturnType<typeof aiWorkbench.detail>>>>;
  javaCountersRemainStrings: AssertTrue<IsEqual<JavaPage<unknown>['totalNum'], string>>;
  autolabCountersRemainNumbers: AssertTrue<IsEqual<AutoLabPage<unknown>['totalNum'], number>>;
};
