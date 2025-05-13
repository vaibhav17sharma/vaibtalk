"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Radio, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const settingsFormSchema = z.object({
  notifications: z.object({
    messageNotifications: z.boolean(),
    soundEnabled: z.boolean(),
    callNotifications: z.boolean(),
  }),
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    showReadReceipts: z.boolean(),
    allowContactRequests: z.boolean(),
  }),
  webrtc: z.object({
    enableHighDefinition: z.boolean(),
    noiseSuppression: z.boolean(),
    echoCancellation: z.boolean(),
    autoGainControl: z.boolean(),
    preferredFrameRate: z.string(),
    preferredBitrate: z.string(),
  }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const defaultValues: Partial<SettingsFormValues> = {
  notifications: {
    messageNotifications: true,
    soundEnabled: true,
    callNotifications: true,
  },
  privacy: {
    showOnlineStatus: true,
    showReadReceipts: true,
    allowContactRequests: true,
  },
  webrtc: {
    enableHighDefinition: true,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    preferredFrameRate: "30",
    preferredBitrate: "1000",
  },
};

export default function SettingsPage() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
  });

  function onSubmit(data: SettingsFormValues) {
    toast("Settings updated", {
      description: "Your settings have been saved successfully.",
    });
    console.log(data);
  }

  return (
    <div className="min-h-screen pt-16 bg-black/90">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[80px]"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-[80px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="max-w-4xl mx-auto bg-background/50 backdrop-blur-sm border-purple-500/20">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <Tabs defaultValue="notifications" className="space-y-6">
                  <TabsList>
                    <TabsTrigger
                      value="notifications"
                      className="flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Privacy
                    </TabsTrigger>
                    <TabsTrigger
                      value="webrtc"
                      className="flex items-center gap-2"
                    >
                      <Radio className="w-4 h-4" /> WebRTC
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="notifications" className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notifications.messageNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Message Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications for new messages
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notifications.soundEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Sound Effects</FormLabel>
                              <FormDescription>
                                Play sounds for notifications and calls
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notifications.callNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Call Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications for incoming calls
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="privacy" className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="privacy.showOnlineStatus"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Online Status</FormLabel>
                              <FormDescription>
                                Show when you're online to others
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="privacy.showReadReceipts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Read Receipts</FormLabel>
                              <FormDescription>
                                Show when you've read messages
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="privacy.allowContactRequests"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Contact Requests</FormLabel>
                              <FormDescription>
                                Allow others to send you contact requests
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="webrtc" className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="webrtc.enableHighDefinition"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>HD Video</FormLabel>
                              <FormDescription>
                                Enable high-definition video calls
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="webrtc.noiseSuppression"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Noise Suppression</FormLabel>
                              <FormDescription>
                                Reduce background noise during calls
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="webrtc.echoCancellation"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Echo Cancellation</FormLabel>
                              <FormDescription>
                                Prevent audio feedback during calls
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="webrtc.autoGainControl"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div>
                              <FormLabel>Auto Gain Control</FormLabel>
                              <FormDescription>
                                Automatically adjust microphone volume
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="webrtc.preferredFrameRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Frame Rate (fps)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                className="bg-muted/40"
                              />
                            </FormControl>
                            <FormDescription>
                              Higher frame rates provide smoother video
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="webrtc.preferredBitrate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Bitrate (kbps)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                className="bg-muted/40"
                              />
                            </FormControl>
                            <FormDescription>
                              Higher bitrates provide better video quality
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                >
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}
