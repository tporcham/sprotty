package io.typefox.sprotty.server.websocket;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import javax.websocket.Endpoint;
import javax.websocket.EndpointConfig;
import javax.websocket.MessageHandler;
import javax.websocket.Session;

import com.google.gson.Gson;

import io.typefox.sprotty.api.Action;
import io.typefox.sprotty.server.json.ActionTypeAdapter;

public class DiagramServerEndpoint extends Endpoint implements Consumer<Action> {
	
	private Session session;
	
	private Gson gson;
	
	private final List<Consumer<Action>> actionListeners = new ArrayList<>();
	
	private final List<Consumer<Exception>> errorListeners = new ArrayList<>();
	
	protected Session getSession() {
		return session;
	}
	
	public void setGson(Gson gson) {
		this.gson = gson;
	}
	
	@Override
	public void onOpen(Session session, EndpointConfig config) {
		this.session = session;
		session.addMessageHandler(new ActionMessageHandler());
	}
	
	public void addActionListener(Consumer<Action> listener) {
		synchronized (actionListeners) {
			this.actionListeners.add(listener);
		}
	}
	
	public void removeActionListener(Consumer<Action> listener) {
		synchronized (actionListeners) {
			this.actionListeners.remove(listener);
		}
	}
	
	public void addErrorListener(Consumer<Exception> listener) {
		synchronized (errorListeners) {
			this.errorListeners.add(listener);
		}
	}
	
	public void removeErrorListener(Consumer<Exception> listener) {
		synchronized (errorListeners) {
			this.errorListeners.remove(listener);
		}
	}
	
	@SuppressWarnings("unchecked")
	protected void fireActionReceived(Action action) {
		Consumer<Action>[] listenerArray;
		synchronized (actionListeners) {
			listenerArray = actionListeners.toArray(new Consumer[actionListeners.size()]);
		}
		for (Consumer<Action> listener : listenerArray) {
			listener.accept(action);
		}
	}
	
	@SuppressWarnings("unchecked")
	protected void fireError(Exception message) {
		Consumer<Exception>[] listenerArray;
		synchronized (errorListeners) {
			listenerArray = errorListeners.toArray(new Consumer[errorListeners.size()]);
		}
		for (Consumer<Exception> listener : listenerArray) {
			listener.accept(message);
		}
	}
	
	protected void initializeGson() {
		if (gson == null) {
			gson = ActionTypeAdapter.createDefaultGson();
		}
	}
	
	@Override
	public void accept(Action action) {
		initializeGson();
		String json = gson.toJson(action, Action.class);
		session.getAsyncRemote().sendText(json);
	}
	
	protected class ActionMessageHandler implements MessageHandler.Whole<String> {
		@Override
		public void onMessage(String message) {
			try {
				initializeGson();
				Action action = gson.fromJson(message, Action.class);
				fireActionReceived(action);
			} catch (Exception exception) {
				fireError(exception);
			}
		}
	}

}