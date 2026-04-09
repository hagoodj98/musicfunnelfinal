import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError } from "../../utils/errorhandler";

// ─── Mock mailchimpClient ─────────────────────────────────────────────────────
vi.mock("../../utils/mailchimp", () => ({
  mailchimpClient: {
    lists: {
      updateListMember: vi.fn(),
      updateListMemberTags: vi.fn(),
    },
  },
}));

import {
  updateMailchimpAddress,
  updateMailchimpTag,
} from "../../utils/mailchimpHelpers";
import { mailchimpClient } from "../../utils/mailchimp";

const mockUpdateListMember = vi.mocked(mailchimpClient.lists.updateListMember);
const mockUpdateListMemberTags = vi.mocked(
  mailchimpClient.lists.updateListMemberTags,
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** MD5 of the lowercase email — what Mailchimp expects as subscriberHash */
import crypto from "crypto";
const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

// ─── updateMailchimpAddress ───────────────────────────────────────────────────

describe("updateMailchimpAddress", () => {
  beforeEach(() => {
    mockUpdateListMember.mockReset();
    process.env.MAILCHIMP_LIST_ID = "test-list-id";
  });

  it("throws HttpError 400 when MAILCHIMP_LIST_ID is not set", async () => {
    delete process.env.MAILCHIMP_LIST_ID;
    await expect(
      updateMailchimpAddress("user@example.com", { addr1: "123 Main St" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("calls updateListMember with the correct list ID", async () => {
    mockUpdateListMember.mockResolvedValue({} as never);
    await updateMailchimpAddress("user@example.com", { addr1: "123 Main St" });
    expect(mockUpdateListMember).toHaveBeenCalledWith(
      "test-list-id",
      expect.any(String),
      expect.any(Object),
    );
  });

  it("calls updateListMember with the MD5 hash of the lowercased email", async () => {
    mockUpdateListMember.mockResolvedValue({} as never);
    await updateMailchimpAddress("User@Example.COM", { addr1: "123 Main St" });
    const expectedHash = md5("user@example.com");
    expect(mockUpdateListMember).toHaveBeenCalledWith(
      expect.any(String),
      expectedHash,
      expect.any(Object),
    );
  });

  it("sends the addressData wrapped under merge_fields.ADDRESS", async () => {
    mockUpdateListMember.mockResolvedValue({} as never);
    const addressData = { addr1: "123 Main St", city: "Springfield" };
    await updateMailchimpAddress("user@example.com", addressData);
    expect(mockUpdateListMember).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { merge_fields: { ADDRESS: addressData } },
    );
  });

  it("returns the Mailchimp response on success", async () => {
    const fakeResponse = { id: "abc123", status: "subscribed" };
    mockUpdateListMember.mockResolvedValue(fakeResponse as never);
    const result = await updateMailchimpAddress("user@example.com", {});
    expect(result).toEqual(fakeResponse);
  });

  it("throws HttpError 500 when the Mailchimp call fails", async () => {
    mockUpdateListMember.mockRejectedValue(new Error("Network error"));
    await expect(
      updateMailchimpAddress("user@example.com", {}),
    ).rejects.toMatchObject({ status: 500 });
    await expect(
      updateMailchimpAddress("user@example.com", {}),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

// ─── updateMailchimpTag ───────────────────────────────────────────────────────

describe("updateMailchimpTag", () => {
  beforeEach(() => {
    mockUpdateListMemberTags.mockReset();
    process.env.MAILCHIMP_LIST_ID = "test-list-id";
  });

  it("throws HttpError 400 when MAILCHIMP_LIST_ID is not set", async () => {
    delete process.env.MAILCHIMP_LIST_ID;
    await expect(
      updateMailchimpTag("user@example.com", "Fan Purchaser"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("calls updateListMemberTags with the correct list ID", async () => {
    mockUpdateListMemberTags.mockResolvedValue({} as never);
    await updateMailchimpTag("user@example.com", "Fan Purchaser");
    expect(mockUpdateListMemberTags).toHaveBeenCalledWith(
      "test-list-id",
      expect.any(String),
      expect.any(Object),
    );
  });

  it("calls updateListMemberTags with the MD5 hash of the lowercased email", async () => {
    mockUpdateListMemberTags.mockResolvedValue({} as never);
    await updateMailchimpTag("User@Example.COM", "Fan Purchaser");
    const expectedHash = md5("user@example.com");
    expect(mockUpdateListMemberTags).toHaveBeenCalledWith(
      expect.any(String),
      expectedHash,
      expect.any(Object),
    );
  });

  it("defaults status to 'active' when not provided", async () => {
    mockUpdateListMemberTags.mockResolvedValue({} as never);
    await updateMailchimpTag("user@example.com", "Fan Purchaser");
    expect(mockUpdateListMemberTags).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { tags: [{ name: "Fan Purchaser", status: "active" }] },
    );
  });

  it("passes status 'inactive' when explicitly provided", async () => {
    mockUpdateListMemberTags.mockResolvedValue({} as never);
    await updateMailchimpTag("user@example.com", "Fan Purchaser", "inactive");
    expect(mockUpdateListMemberTags).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { tags: [{ name: "Fan Purchaser", status: "inactive" }] },
    );
  });

  it("returns the Mailchimp response on success", async () => {
    const fakeResponse = { id: "tag123" };
    mockUpdateListMemberTags.mockResolvedValue(fakeResponse as never);
    const result = await updateMailchimpTag(
      "user@example.com",
      "Fan Purchaser",
    );
    expect(result).toEqual(fakeResponse);
  });

  it("throws HttpError 500 when the Mailchimp call fails", async () => {
    mockUpdateListMemberTags.mockRejectedValue(new Error("Network error"));
    await expect(
      updateMailchimpTag("user@example.com", "Fan Purchaser"),
    ).rejects.toMatchObject({ status: 500 });
    await expect(
      updateMailchimpTag("user@example.com", "Fan Purchaser"),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
