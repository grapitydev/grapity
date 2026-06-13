import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Changelog } from "./Changelog";
import { OverviewTab } from "./OverviewTab";
import { RawSpecTab } from "./RawSpecTab";
import { VersionsTab } from "./VersionsTab";
import { CompareTab } from "./CompareTab";
import type { PublicSpecVersion, CompatReport as CompatReportType } from "core";

interface VersionDetailProps {
  version: PublicSpecVersion;
  compatReport: CompatReportType | null;
  name: string;
  jsonContent: string;
  yamlContent: string;
  contentLoading: boolean;
  jsonLoading: boolean;
  versions: PublicSpecVersion[];
  specName: string;
}

export function VersionDetail({
  version,
  compatReport,
  name,
  jsonContent,
  yamlContent,
  contentLoading,
  jsonLoading,
  versions,
  specName,
}: VersionDetailProps) {
  const isInitial = !version.previousVersion;

  return (
    <Tabs defaultTab="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="compat">Changelog</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
        <TabsTrigger value="raw">Raw Spec</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab version={version} jsonContent={jsonContent} jsonLoading={jsonLoading} />
      </TabsContent>

      <TabsContent value="compat">
        <Changelog report={compatReport} isInitial={isInitial} />
      </TabsContent>

      <TabsContent value="versions">
        <VersionsTab versions={versions} specName={specName} currentSemver={version.semver} />
      </TabsContent>

      <TabsContent value="compare">
        <CompareTab versions={versions} specName={specName} currentSemver={version.semver} />
      </TabsContent>

      <TabsContent value="raw">
        <RawSpecTab
          jsonContent={jsonContent}
          yamlContent={yamlContent}
          loading={contentLoading}
        />
      </TabsContent>
    </Tabs>
  );
}
